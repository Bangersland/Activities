import React, { useState, useEffect } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import TimerCard from './TimerCard.jsx';
import './timer.css';

function Timer() {
    const [timers, setTimers] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setTimers(prevTimers =>
                prevTimers.map(timer => {
                    if (timer.isRunning && timer.time > 0) {
                        return { ...timer, time: timer.time - 1 };
                    } else {
                        return timer;
                    }
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleAddTimer = () => {
        const seconds = parseInt(inputValue);
        if (isNaN(seconds) || seconds < 0) return;

        const newTimer = {
            id: Date.now(),
            time: seconds,
            originalTime: seconds,
            isRunning: true,
        };

        setTimers([...timers, newTimer]);
        setInputValue('');
    };

    const handlePause = (id) => {
        setTimers(prev =>
            prev.map(timer =>
                timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
            )
        );
    };

    const handleReset = (id) => {
        setTimers(prev =>
            prev.map(timer =>
                timer.id === id
                    ? { ...timer, time: timer.originalTime, isRunning: true }
                    : timer
            )
        );
    };

    const handleDelete = (id) => {
        setTimers(prev => prev.filter(timer => timer.id !== id));
    };

    return (
        <Container className="timer-container">
            <div className="top-input">
                <Form.Control
                    type="text"
                    placeholder="0"
                    className="input-field"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <Button variant="primary" onClick={handleAddTimer}>Add Timer</Button>
            </div>

            <div className="cards-wrapper">
                {timers.map(timer => (
                    <TimerCard
                        key={timer.id}
                        id={timer.id}
                        time={timer.time}
                        isRunning={timer.isRunning}
                        onPause={handlePause}
                        onReset={handleReset}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </Container>
    );
}

export default Timer;
