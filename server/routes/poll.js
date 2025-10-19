const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Poll = require('../models/Poll');

/**
 * @route   POST /polls
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, options } = req.body;

    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ msg: 'Title and at least 2 options are required' });
    }

    const poll = new Poll({
      title,
      options: options.map(text => ({ text })),
      createdBy: req.user.id,
    });

    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET polls
 */
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET :id
 */
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('createdBy', 'name email');
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST :id/vote
 */
router.post('/:id/vote', auth, async (req, res) => {
  const { optionIndex } = req.body;
  const pollId = req.params.id;
  const userId = req.user.id;

  if (typeof optionIndex !== 'number') {
    return res.status(400).json({ msg: 'optionIndex required and must be a number' });
  }

  try {
    // Validate poll and option index
    const poll = await Poll.findById(pollId).select('options');
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ msg: 'Invalid option index' });
    }

    // only add vote if user hasn't already voted
    const query = { _id: pollId, 'votes.user': { $ne: userId } };
    const update = { $push: { votes: { user: userId, optionIndex } } };

    const updated = await Poll.findOneAndUpdate(query, update, { new: true });

    if (!updated) {
      const alreadyVoted = await Poll.findOne({ _id: pollId, 'votes.user': userId });
      if (alreadyVoted) return res.status(400).json({ msg: 'User has already voted' });
      return res.status(400).json({ msg: 'Could not record vote' });
    }

    res.json({ msg: 'Vote recorded', poll: updated });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST :id/comment
 */
router.post('/:id/comment', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ msg: 'Comment text is required' });
  }

  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });

    const comment = {
      user: req.user.id,
      text: text.trim(),
      date: new Date(),
    };

    poll.comments.push(comment);
    await poll.save();

    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
