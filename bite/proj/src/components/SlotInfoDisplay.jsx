import React, { useState, useEffect } from 'react';
import { getAppointmentCountByDate } from '../supabase';

const SlotInfoDisplay = ({ slotInfo }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = async () => {
      if (!slotInfo) {
        setMetrics(null);
        setLoading(false);
        return;
      }

      try {
        const { count: bookedCount } = await getAppointmentCountByDate(slotInfo.date);
        const availableSlots = slotInfo.available_slots || 0;
        const remainingSlots = Math.max(0, availableSlots - bookedCount);

        setMetrics({
          available: availableSlots,
          booked: bookedCount,
          remaining: remainingSlots
        });
      } catch (error) {
        console.error('Error calculating metrics:', error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
  }, [slotInfo]);

  if (loading) {
    return <div>Loading slot info...</div>;
  }

  if (!metrics) {
    return (
      <div className="info-item">
        <label>Available Slots:</label>
        <span>0</span>
      </div>
    );
  }

  return (
    <>
      <div className="info-item">
        <label>Available Slots:</label>
        <span>{metrics.available}</span>
      </div>
      <div className="info-item">
        <label>Booked Slots:</label>
        <span>{metrics.booked}</span>
      </div>
      <div className="info-item">
        <label>Remaining Slots:</label>
        <span>{metrics.remaining}</span>
      </div>
    </>
  );
};

export default SlotInfoDisplay;
