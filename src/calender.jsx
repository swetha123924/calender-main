import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import CalenderImage from './assets/Calenderimage.jpg';
import Main from './assets/bg.jpg';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState({});
    const [eventInput, setEventInput] = useState('');
    const [eventType, setEventType] = useState('task');
    const [eventTime, setEventTime] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);

    useEffect(() => {
        const storedEvents = localStorage.getItem('events');
        if (storedEvents) {
            setEvents(JSON.parse(storedEvents));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            Object.keys(events).forEach(date => {
                events[date].forEach(event => {
                    const eventDateTime = new Date(`${date}T${event.time}`);
                    if (eventDateTime <= now) {
                        alert(`Event: ${event.title} is due!`);
                    }
                });
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [events]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-16 h-16"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(dateString).toDateString();
            days.push(
                <div 
                    key={day} 
                    className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition duration-200 ease-in-out ${isToday ? 'bg-blue-300' : 'hover:bg-gray-100'}`}
                    onClick={() => handleDayClick(dateString)}
                >
                    <span className={`font-semibold ${isToday ? 'text-white' : 'text-gray-800'}`}>{day}</span>
                    {events[dateString] && events[dateString].map((event, index) => (
                        <span key={index} className="text-red-700 text-xs text-center font-bold">{event.title}</span>
                    ))}
                </div>
            );
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (dateString) => {
        setSelectedDate(dateString);
        setIsModalOpen(true);
    };

    const handleAddEvent = () => {
        if (!eventInput || !eventTime || !eventDescription) {
            console.log("Event input fields are not valid.");
            return;
        }

        setEvents((prevEvents) => {
            const newEvents = { ...prevEvents };
            if (!newEvents[selectedDate]) {
                newEvents[selectedDate] = [];
            }
            newEvents[selectedDate].push({
                title: eventInput,
                type: eventType,
                time: eventTime,
                description: eventDescription,
            });
            return newEvents;
        });

        setEventInput('');
        setEventTime('');
        setEventDescription('');
        setIsModalOpen(false);
    };

    const handleSeeAllEvents = () => {
        setIsAllEventsOpen(true);
    };

    const handleCloseAllEvents = () => {
        setIsAllEventsOpen(false);
    };

    const getDayOfWeek = (date) => {
        const options = { weekday: 'long' };
        return date.toLocaleDateString('en-US', options);
    };

    return (
        <div className="flex flex-col items-center" style={{ backgroundImage: `url(${Main})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh' }}>
            <header className='bg-blue-500 text-white p-4 rounded-lg shadow-md mb-4 flex flex-col justify-between gap-4 w-full max-w-md'>
                <section>
                    <h1 className="text-3xl font-bold">{getDayOfWeek(currentDate)}</h1>
                    <h1 className="text-3xl font-bold">{currentDate.getDate()}</h1>
                    <p className="text-lg font-bold">{currentDate.toLocaleString('default', { month: 'long' })}</p>
                </section>
                <section>
                    {selectedDate && events[selectedDate] && events[selectedDate].length > 0 ? (
                        <div className="mt-2">
                            <h2 className="text-lg font-bold">Events</h2>
                            <ul className="list-none">
                                {events[selectedDate].map((event, index) => (
                                    <li key={index} className="text-black font-bold">
                                        <strong>{event.title}</strong> - {event.time}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={handleSeeAllEvents} className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">See All Events</button>
                        </div>
                    ) : (
                        <div className="mt-2 text-black font-bold">No events for this date.</div>
                    )}
                </section>
            </header>
            {!isModalOpen && !isAllEventsOpen && (
                <div className="relative w-full max-w-md">
                    <img src={CalenderImage} alt="Calendar" className="absolute inset-0 w-full h-full rounded-4xl object-cover" />
                    <div className="p-4 rounded-lg shadow-md flex flex-col relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handlePrevMonth} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">Prev</button>
                            <h1 className="text-2xl font-bold">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h1>
                            <button onClick={handleNextMonth} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">Next</button>
                        </div>
                        <div className="grid grid-cols-7 text-center font-bold mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <div key={index} className="p-2">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {renderDays()}
                        </div>
                    </div>
                </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-md w-80 relative z-10">
                        <h2 className="text-lg font-bold mb-2">Add Event for {selectedDate}</h2>
                        <div className="flex justify-between mb-2">
                            <button onClick={() => setEventType('task')} className={`p-2 rounded ${eventType === 'task' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Task</button>
                            <button onClick={() => setEventType('appointment')} className={`p-2 rounded ${eventType === 'appointment' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Appointment</button>
                        </div>
                        <input 
                            type="text" 
                            value={eventInput} 
                            onChange={(e) => setEventInput(e.target.value)} 
                            className="border border-gray-300 p-2 rounded w-full mb-2" 
                            placeholder="Event name" 
                        />
                        <div className="flex items-center mb-2">
                            <Clock className="text-gray-500 mr-2" />
                            <input 
                                type="time" 
                                value={eventTime} 
                                onChange={(e) => setEventTime(e.target.value)} 
                                className="border border-gray-300 p-2 rounded w-full" 
                            />
                        </div>
                        <textarea 
                            value={eventDescription} 
                            onChange={(e) => setEventDescription(e.target.value)} 
                            className="border border-gray-300 p-2 rounded w-full mb-2" 
                            placeholder="Event description" 
                            rows="3"
                        />
                        <div className="flex justify-end">
                            <button onClick={handleAddEvent} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200">Add Event</button>
                            <button onClick={() => setIsModalOpen(false)} className="ml-2 bg-gray-300 p-2 rounded hover:bg-gray-400 transition duration-200">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {isAllEventsOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-md w-80 relative z-10">
                        <h2 className="text-lg font-bold mb-2">All Events for {selectedDate}</h2>
                        <ul className="list-none">
                            {events[selectedDate] && events[selectedDate].length > 0 ? (
                                events[selectedDate].map((event, index) => (
                                    <li key={index} className="text-black font-bold">
                                        <strong>{event.title}</strong> - {event.time}
                                    </li>
                                ))
                            ) : (
                                <li className="text-black">No events for this date.</li>
                            )}
                        </ul>
                        <div className="flex justify-end">
                            <button onClick={handleCloseAllEvents} className="bg-gray-300 p-2 rounded hover:bg-gray-400 transition duration-200">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;