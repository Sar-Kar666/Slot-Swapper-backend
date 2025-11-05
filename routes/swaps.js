import express from 'express';
import Event from '../models/Event.js';
import SwapRequest from '../models/SwapRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/swappable-slots', async (req, res) => {
  try {
    const slots = await Event.find({
      status: 'SWAPPABLE',
      userId: { $ne: req.user.userId },
    }).populate('userId', 'name email');

    res.json(slots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/swap-request', async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ message: 'Both slot IDs are required' });
    }

    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    if (!mySlot || !theirSlot) {
      return res.status(404).json({ message: 'One or both slots not found' });
    }

    if (mySlot.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You cannot swap this slot' });
    }

    if (mySlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ message: 'Your slot is not swappable' });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ message: 'Their slot is not swappable' });
    }

    const swapRequest = new SwapRequest({
      mySlotId,
      theirSlotId,
      requestingUserId: req.user.userId,
      respondingUserId: theirSlot.userId,
    });

    await swapRequest.save();

    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';

    await mySlot.save();
    await theirSlot.save();

    // Emit newSwapRequest event to the responding user
    const io = (await import('../socket.js')).io;
    try {
      console.log('Emitting newSwapRequest to user:', theirSlot.userId.toString());
      io.to(`user:${theirSlot.userId.toString()}`).emit('newSwapRequest', {
        id: swapRequest._id,
        from: req.user.name || 'Someone',
        slot: mySlot.title || mySlot.timeSlot || 'a slot'
      });
    } catch (error) {
      console.error('Error emitting newSwapRequest:', error);
    }

    res.status(201).json(swapRequest);
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/incoming', async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      respondingUserId: req.user.userId,
      status: 'PENDING',
    })
      .populate('mySlotId')
      .populate('theirSlotId')
      .populate('requestingUserId', 'name email');

    res.json(requests);
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/outgoing', async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      requestingUserId: req.user.userId,
    })
      .populate('mySlotId')
      .populate('theirSlotId')
      .populate('respondingUserId', 'name email');

    res.json(requests);
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/swap-response/:requestId', async (req, res) => {
  try {
    const { accept } = req.body;

    const swapRequest = await SwapRequest.findById(req.params.requestId);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.respondingUserId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const mySlot = await Event.findById(swapRequest.mySlotId);
    const theirSlot = await Event.findById(swapRequest.theirSlotId);

    if (!mySlot || !theirSlot) {
      return res.status(404).json({ message: 'One or both slots not found' });
    }

    if (accept) {
      swapRequest.status = 'ACCEPTED';

      const tempUserId = mySlot.userId;
      mySlot.userId = theirSlot.userId;
      theirSlot.userId = tempUserId;

      mySlot.status = 'BUSY';
      theirSlot.status = 'BUSY';
    } else {
      swapRequest.status = 'REJECTED';

      mySlot.status = 'SWAPPABLE';
      theirSlot.status = 'SWAPPABLE';
    }

    await swapRequest.save();
    await mySlot.save();
    await theirSlot.save();

    // Emit swap request update event to the requesting user
    const io = (await import('../socket.js')).io;
    try {
      console.log('Emitting swapRequestUpdate to user:', swapRequest.requestingUserId.toString());
      io.to(`user:${swapRequest.requestingUserId.toString()}`).emit('swapRequestUpdate', {
        requestId: swapRequest._id,
        status: swapRequest.status,
        slot: mySlot.title || mySlot.timeSlot || 'the requested slot'
      });
    } catch (error) {
      console.error('Error emitting swapRequestUpdate:', error);
    }

    res.json(swapRequest);
  } catch (error) {
    console.error('Swap response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
