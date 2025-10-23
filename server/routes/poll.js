const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Poll = require('../models/Poll');

/**
 * @route   POST /polls
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, options, allowMultipleVotes } = req.body;
    console.log(allowMultipleVotes, "done");

    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ msg: 'Title and at least 2 options are required' });
    }

    const poll = new Poll({
      title,
      options: options.map(text => ({ text })),
      createdBy: req.user.id,
      allowMultipleVotes: !!allowMultipleVotes,
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
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });

    const { optionIndexes } = req.body; // accept array for multiple votes
    let indexes = Array.isArray(optionIndexes) ? optionIndexes : [req.body.optionIndex];

    if (!indexes || indexes.length === 0) {
      return res.status(400).json({ msg: 'No options selected' });
    }

    // Check existing votes for this user
    const userVotes = poll.votes.filter(v => v.user.toString() === req.user.id);

    if (!poll.allowMultipleVotes && userVotes.length > 0) {
      return res.status(400).json({ msg: 'User has already voted' });
    }

    // For multiple votes, prevent voting for the same option twice
    const alreadyVotedOptions = userVotes.map(v => v.optionIndex);
    const newIndexes = indexes.filter(i => !alreadyVotedOptions.includes(i));

    if (newIndexes.length === 0) {
      return res.status(400).json({ msg: 'You already voted for these options' });
    }

    // Record votes
    newIndexes.forEach(i => {
      poll.votes.push({ user: req.user.id, optionIndex: i });
      poll.options[i].votes = (poll.options[i].votes || 0) + 1;
    });

    await poll.save();

    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    res.json(updatedPoll);
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ msg: 'Server error' });
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
