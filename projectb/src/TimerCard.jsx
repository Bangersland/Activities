import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import './timer.css';

function TimerCard(props) {
    const isRed = props.time === 0;

    return (
        <div className={`timer-card ${isRed ? 'red' : 'blue'}`}>
            <button className="delete-btn" onClick={() => props.onDelete(props.id)}>×</button>
            <div className="timer-value">{props.time}</div>
            <div className="timer-buttons">
                <Button
                    variant={isRed ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => props.onPause(props.id)}
                >
                    {props.isRunning ? 'pause' : 'resume'}
                </Button>
                <Button
                    variant={isRed ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => props.onReset(props.id)}
                >
                    reset
                </Button>
            </div>
        </div>
    );
}

TimerCard.propTypes = {
    id: PropTypes.number,
    time: PropTypes.number,
    isRunning: PropTypes.bool,
    onPause: PropTypes.func,
    onReset: PropTypes.func,
    onDelete: PropTypes.func,
};

TimerCard.defaultProps = {
    id: 0,
    time: 0,
    isRunning: false,
    onPause: () => {},
    onReset: () => {},
    onDelete: () => {},
};

export default TimerCard;
