// routes/analytics.js

import express from 'express';
import mongoose from 'mongoose';

import {Event} from '../models/Event.js';
import {User} from '../models/Users.js';
import {Registration} from '../models/Registration.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/organizer/:id
router.get('/organizer/:id', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.params.id;

    // Validate organizer ID
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ success: false, message: 'Invalid organizer ID' });
    }

    const events = await Event.find({ createdBy: organizerId });
    const currentDate = new Date();

    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => new Date(event.date) >= currentDate).length;
    const expiredEvents = events.filter(event => new Date(event.date) < currentDate).length;

    const eventIds = events.map(event => event._id);
    const registrations = await Registration.find({ eventId: { $in: eventIds } });
    const totalRegistrations = registrations.length;

    const eventsByCategory = {};
    events.forEach(event => {
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
    });

    const eventsByMonth = {};
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      months.push(monthKey);
      eventsByMonth[monthKey] = 0;
    }

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const monthKey = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (eventsByMonth.hasOwnProperty(monthKey)) {
        eventsByMonth[monthKey]++;
      }
    });

    const registrationsByEvent = events.map(event => {
      const count = registrations.filter(reg => reg.eventId.toString() === event._id.toString()).length;
      return { eventTitle: event.title, registrations: count };
    });

    const revenueByEvent = events.map(event => {
      const count = registrations.filter(reg => reg.eventId.toString() === event._id.toString()).length;
      const revenue = count * (event.price || 0);
      return { eventTitle: event.title, revenue };
    });

    const analyticsData = {
      totalEvents,
      upcomingEvents,
      expiredEvents,
      totalRegistrations,
      eventsByCategory,
      eventsByMonth,
      registrationsByEvent,
      revenueByEvent
    };

    res.json({ success: true, data: analyticsData });

  } catch (error) {
    console.error('Error fetching organizer analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/analytics/admin
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const users = await User.find({ role: 'user' });
    const organizers = await User.find({ role: 'organizer' });
    const events = await Event.find();
    const registrations = await Registration.find();

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        totalOrganizers: organizers.length,
        totalEvents: events.length,
        totalRegistrations: registrations.length
      }
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
