import React, { useState, useEffect } from 'react';
import { getAppointmentCountByDate } from '../supabase';

const SlotMetricsDisplay = ({ slotInfo }) => {
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
        const percentage = availableSlots > 0 ? Math.round((bookedCount / availableSlots) * 100) : 0;

        setMetrics({
          available: availableSlots,
          booked: bookedCount,
          remaining: remainingSlots,
          percentage
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
    return <div>Loading metrics...</div>;
  }

  if (!metrics) {
    return <h4>No slot data available</h4>;
  }

  return (
    <>
      <h4>Capacity: {metrics.booked}/{metrics.available} slots filled</h4>
      <div className="percentage-display">
        {metrics.percentage}%
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${metrics.percentage}%` }}
        ></div>
      </div>
    </>
  );
};

export default SlotMetricsDisplay;
