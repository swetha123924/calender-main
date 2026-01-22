import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar as CalendarIcon, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Moon, Sun, Download, Upload, Filter, Settings, Bell, MapPin } from 'lucide-react';

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
    const [view, setView] = useState('month'); // month, week, day, agenda
    const [searchTerm, setSearchTerm] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventCategory, setEventCategory] = useState('personal');
    const [darkMode, setDarkMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [recurring, setRecurring] = useState(false);
    const [recurringType, setRecurringType] = useState('daily');
    const [location, setLocation] = useState('');
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [notifications, setNotifications] = useState(true);
    // eslint-disable-next-line no-unused-vars
    const [weather, setWeather] = useState(null);
    const calendarRef = useRef(null);
    const [categories] = useState({
        personal: { color: 'bg-blue-500', text: 'Personal', darkColor: 'bg-blue-600' },
        work: { color: 'bg-green-500', text: 'Work', darkColor: 'bg-green-600' },
        health: { color: 'bg-red-500', text: 'Health', darkColor: 'bg-red-600' },
        social: { color: 'bg-purple-500', text: 'Social', darkColor: 'bg-purple-600' },
        other: { color: 'bg-gray-500', text: 'Other', darkColor: 'bg-gray-600' }
    });

    // Load settings from localStorage
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        const savedNotifications = localStorage.getItem('notifications');
        if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
        if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [darkMode, notifications]);

    

    // Enhanced notification system
    useEffect(() => {
        if (!notifications) return;

        const interval = setInterval(() => {
            const now = new Date();
            Object.keys(events).forEach(date => {
                events[date].forEach(event => {
                    const eventDateTime = new Date(`${date}T${event.time}`);
                    const timeDiff = eventDateTime - now;
                    
                    if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000 && !event.notified15) { // 15 minutes before
                        if (Notification.permission === 'granted') {
                            new Notification(`Upcoming Event: ${event.title}`, {
                                body: `In 15 minutes at ${event.time}`,
                                icon: '/calendar-icon.png'
                            });
                        }
                        event.notified15 = true;
                    }
                    
                    if (timeDiff <= 0 && !event.notified) {
                        if (Notification.permission === 'granted') {
                            new Notification(`Event Started: ${event.title}`, {
                                body: `Starting now at ${event.time}`,
                                icon: '/calendar-icon.png'
                            });
                        }
                        event.notified = true;
                    }
                });
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [events, notifications]);

    // Request notification permission
    useEffect(() => {
        if (notifications && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [notifications]);
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
                    if (eventDateTime <= now && !event.notified) {
                        alert(`Event: ${event.title} is due!`);
                        event.notified = true;
                    }
                });
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [events]);

    // Advanced functions
    const exportEvents = () => {
        const dataStr = JSON.stringify(events, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'calendar-events.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const importEvents = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedEvents = JSON.parse(e.target.result);
                    setEvents(importedEvents);
                    alert('Events imported successfully!');
                } catch {
                    alert('Error importing events. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDragStart = (event, draggedEventData, dateString) => {
        setDraggedEvent({ event: draggedEventData, fromDate: dateString });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, toDateString) => {
        e.preventDefault();
        if (draggedEvent && draggedEvent.fromDate !== toDateString) {
            // Remove from old date
            setEvents(prevEvents => {
                const newEvents = { ...prevEvents };
                newEvents[draggedEvent.fromDate] = newEvents[draggedEvent.fromDate].filter(e => e !== draggedEvent.event);
                if (newEvents[draggedEvent.fromDate].length === 0) {
                    delete newEvents[draggedEvent.fromDate];
                }
                // Add to new date
                if (!newEvents[toDateString]) {
                    newEvents[toDateString] = [];
                }
                newEvents[toDateString].push(draggedEvent.event);
                return newEvents;
            });
        }
        setDraggedEvent(null);
    };

    const createRecurringEvents = (baseEvent, startDate, recurringType, count = 10) => {
        const recurringEvents = [];
        const baseDate = new Date(startDate);
        
        for (let i = 0; i < count; i++) {
            let newDate = new Date(baseDate);
            
            switch (recurringType) {
                case 'daily':
                    newDate.setDate(baseDate.getDate() + i);
                    break;
                case 'weekly':
                    newDate.setDate(baseDate.getDate() + (i * 7));
                    break;
                case 'monthly':
                    newDate.setMonth(baseDate.getMonth() + i);
                    break;
                default:
                    break;
            }
            
            const dateString = newDate.toISOString().split('T')[0];
            recurringEvents.push({
                ...baseEvent,
                recurringId: baseEvent.id || Date.now(),
                instanceDate: dateString
            });
        }
        
        return recurringEvents;
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getWeekDates = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(startOfWeek);
            weekDate.setDate(startOfWeek.getDate() + i);
            weekDates.push(weekDate);
        }
        return weekDates;
    };

    const getDayEvents = (dateString) => {
        return events[dateString] || [];
    };

    const filteredEvents = () => {
        let filtered = events;
        
        // Filter by search term
        if (searchTerm) {
            filtered = {};
            Object.keys(events).forEach(date => {
                const dayEvents = events[date].filter(event => 
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                if (dayEvents.length > 0) {
                    filtered[date] = dayEvents;
                }
            });
        }
        
        // Filter by category
        if (filterCategory !== 'all') {
            const categoryFiltered = {};
            Object.keys(filtered).forEach(date => {
                const dayEvents = filtered[date].filter(event => event.category === filterCategory);
                if (dayEvents.length > 0) {
                    categoryFiltered[date] = dayEvents;
                }
            });
            filtered = categoryFiltered;
        }
        
        return filtered;
    };

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = [];
        const filtered = filteredEvents();

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-16 md:h-16"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(dateString).toDateString();
            const dayEvents = filtered[dateString] || [];
            days.push(
                <div
                    key={day}
                    className={`w-8 h-8 md:w-16 md:h-16 flex flex-col items-center justify-start rounded-lg transition-all duration-300 ease-in-out p-0.5 md:p-1 cursor-pointer ${
                        isToday
                            ? (darkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-300 shadow-md')
                            : (darkMode ? 'hover:bg-gray-700 hover:shadow-md' : 'hover:bg-gray-100 hover:shadow-sm')
                    } ${draggedEvent && draggedEvent.fromDate === dateString ? 'opacity-50' : ''}`}
                    onClick={() => handleDayClick(dateString)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateString)}
                >
                    <span className={`font-semibold text-xs md:text-sm ${isToday ? 'text-white' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                        {dayEvents.slice(0, 3).map((event, index) => (
                            <div
                                key={index}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${darkMode ? categories[event.category || 'personal'].darkColor : categories[event.category || 'personal'].color} cursor-move transition-transform hover:scale-110`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, event, dateString)}
                                title={event.title}
                            ></div>
                        ))}
                        {dayEvents.length > 3 && <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>+{dayEvents.length - 3}</span>}
                    </div>
                </div>
            );
        }

        return days;
    };

    const renderWeekView = () => {
        const weekDates = getWeekDates(currentDate);
        return (
            <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-1 md:gap-2 min-w-max">
                    <div className="font-bold p-1 md:p-2 text-xs md:text-sm">Time</div>
                    {weekDates.map((date, index) => (
                        <div key={index} className="font-bold p-1 md:p-2 text-center text-xs md:text-sm">
                            <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-lg md:text-xl font-bold">{date.getDate()}</div>
                        </div>
                    ))}
                    {Array.from({ length: 24 }, (_, hour) => (
                        <React.Fragment key={hour}>
                            <div className="p-1 md:p-2 text-xs md:text-sm text-gray-600 border-t">{`${hour}:00`}</div>
                            {weekDates.map((date, dayIndex) => {
                                const dateString = date.toISOString().split('T')[0];
                                const dayEvents = getDayEvents(dateString).filter(event => {
                                    const eventHour = parseInt(event.time.split(':')[0]);
                                    return eventHour === hour;
                                });
                                return (
                                    <div key={dayIndex} className="p-0.5 md:p-1 border-t min-h-8 md:min-h-12 relative">
                                        {dayEvents.map((event, eventIndex) => (
                                            <div
                                                key={eventIndex}
                                                className={`p-0.5 md:p-1 mb-0.5 md:mb-1 rounded text-xs ${categories[event.category || 'personal'].color} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                                                onClick={() => handleEventClick(event, dateString)}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayEvents = getDayEvents(dateString);
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div>
                    <h3 className="text-base md:text-lg font-bold mb-2 md:mb-4">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                    <div className="space-y-1 md:space-y-2 max-h-96 overflow-y-auto">
                        {Array.from({ length: 24 }, (_, hour) => {
                            const hourEvents = dayEvents.filter(event => parseInt(event.time.split(':')[0]) === hour);
                            return (
                                <div key={hour} className="flex">
                                    <div className="w-12 md:w-16 text-xs md:text-sm text-gray-600">{`${hour}:00`}</div>
                                    <div className="flex-1 min-h-8 md:min-h-12 border-l pl-1 md:pl-2">
                                        {hourEvents.map((event, index) => (
                                            <div
                                                key={index}
                                                className={`p-1 md:p-2 mb-0.5 md:mb-1 rounded text-xs md:text-sm ${categories[event.category || 'personal'].color} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                                                onClick={() => handleEventClick(event, dateString)}
                                            >
                                                <div className="font-semibold">{event.title}</div>
                                                <div className="text-xs">{event.time} - {event.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-base md:text-lg font-bold mb-2 md:mb-4">All Events</h3>
                    <div className="space-y-1 md:space-y-2 max-h-96 overflow-y-auto">
                        {dayEvents.map((event, index) => (
                            <div key={index} className={`p-2 md:p-3 rounded ${categories[event.category || 'personal'].color} text-white`}>
                                <div className="font-semibold text-sm md:text-base">{event.title}</div>
                                <div className="text-xs md:text-sm">{event.time}</div>
                                <div className="text-xs md:text-sm opacity-90">{event.description}</div>
                                <div className="flex gap-1 md:gap-2 mt-1 md:mt-2">
                                    <button onClick={() => handleEditEvent(event, dateString)} className="text-xs bg-white text-black px-1 md:px-2 py-0.5 md:py-1 rounded hover:bg-gray-200 transition-colors">Edit</button>
                                    <button onClick={() => handleDeleteEvent(event, dateString)} className="text-xs bg-red-500 text-white px-1 md:px-2 py-0.5 md:py-1 rounded hover:bg-red-600 transition-colors">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderAgendaView = () => {
        const allEvents = [];
        Object.keys(filteredEvents()).forEach(date => {
            filteredEvents()[date].forEach(event => {
                allEvents.push({ ...event, date });
            });
        });
        allEvents.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

        return (
            <div className="space-y-2 md:space-y-4 max-h-96 overflow-y-auto">
                {allEvents.map((event, index) => (
                    <div key={index} className={`p-3 md:p-4 rounded-lg ${categories[event.category || 'personal'].color} text-white`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                                <h3 className="font-bold text-base md:text-lg">{event.title}</h3>
                                <p className="text-xs md:text-sm">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                                <p className="text-xs md:text-sm mt-1 opacity-90">{event.description}</p>
                            </div>
                            <div className="flex gap-1 md:gap-2">
                                <button onClick={() => handleEditEvent(event, event.date)} className="text-xs bg-white text-black px-1 md:px-2 py-0.5 md:py-1 rounded hover:bg-gray-200 transition-colors">Edit</button>
                                <button onClick={() => handleDeleteEvent(event, event.date)} className="text-xs bg-red-500 text-white px-1 md:px-2 py-0.5 md:py-1 rounded hover:bg-red-600 transition-colors">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handlePrevMonth = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (view === 'week') {
            setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
        } else if (view === 'day') {
            setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
        }
    };

    const handleNextMonth = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (view === 'week') {
            setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
        } else if (view === 'day') {
            setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        }
    };

    const handleDayClick = (dateString) => {
        setSelectedDate(dateString);
        setIsModalOpen(true);
        setEditingEvent(null);
    };

    const handleEventClick = (event, dateString) => {
        setSelectedDate(dateString);
        setEditingEvent(event);
        setEventInput(event.title);
        setEventType(event.type);
        setEventTime(event.time);
        setEventDescription(event.description);
        setEventCategory(event.category || 'personal');
        setLocation(event.location || '');
        setRecurring(event.recurring || false);
        setRecurringType(event.recurringType || 'daily');
        setIsModalOpen(true);
    };

    const handleAddEvent = () => {
        if (!eventInput || !eventTime || !eventDescription) {
            alert("Please fill in all fields.");
            return;
        }

        const eventData = {
            id: editingEvent?.id || Date.now(),
            title: eventInput,
            type: eventType,
            time: eventTime,
            description: eventDescription,
            category: eventCategory,
            location: location,
            recurring: recurring,
            recurringType: recurring ? recurringType : null
        };

        setEvents((prevEvents) => {
            const newEvents = { ...prevEvents };
            
            if (editingEvent) {
                // Edit existing event
                const eventIndex = newEvents[selectedDate].findIndex(e => e.id === editingEvent.id);
                if (eventIndex !== -1) {
                    newEvents[selectedDate][eventIndex] = eventData;
                }
            } else {
                // Add new event
                if (!newEvents[selectedDate]) {
                    newEvents[selectedDate] = [];
                }
                
                if (recurring) {
                    // Create recurring events
                    const recurringEvents = createRecurringEvents(eventData, selectedDate, recurringType);
                    recurringEvents.forEach(recurringEvent => {
                        const dateStr = recurringEvent.instanceDate;
                        if (!newEvents[dateStr]) {
                            newEvents[dateStr] = [];
                        }
                        newEvents[dateStr].push(recurringEvent);
                    });
                } else {
                    newEvents[selectedDate].push(eventData);
                }
            }
            return newEvents;
        });

        setEventInput('');
        setEventTime('');
        setEventDescription('');
        setEventCategory('personal');
        setLocation('');
        setRecurring(false);
        setRecurringType('daily');
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleEditEvent = (event, dateString) => {
        handleEventClick(event, dateString);
    };

    const handleDeleteEvent = (event, dateString) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            setEvents((prevEvents) => {
                const newEvents = { ...prevEvents };
                newEvents[dateString] = newEvents[dateString].filter(e => e !== event);
                if (newEvents[dateString].length === 0) {
                    delete newEvents[dateString];
                }
                return newEvents;
            });
        }
    };

    // const handleSeeAllEvents = () => {
    //     setIsAllEventsOpen(true);
    // };

    const handleCloseAllEvents = () => {
        setIsAllEventsOpen(false);
    };

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-gray-900'}`}>
            <div className="container mx-auto px-4 py-6 max-w-7xl" ref={calendarRef}>
                {/* Header */}
                <header className={`${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'} backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-xl mb-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    {/* Mobile Header */}
                    <div className="block md:hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Calendar</h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2 rounded-xl transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2 rounded-xl transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    <Settings className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Weather & Search */}
                        <div className="space-y-3 mb-4">
                            {weather && (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50/50'} backdrop-blur-sm`}>
                                    <span className="text-sm font-medium">{weather.temp}°C</span>
                                    <span className="text-sm">{weather.condition}</span>
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">{weather.location}</span>
                                </div>
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                                        darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={handlePrevMonth} className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-center min-w-0 flex-1 mx-2 truncate">
                                {view === 'month' && `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}`}
                                {view === 'week' && `Week ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                {view === 'day' && currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {view === 'agenda' && 'All Events'}
                            </h2>
                            <button onClick={handleNextMonth} className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mobile View Toggle */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {['month', 'week', 'day', 'agenda'].map((viewType) => (
                                <button
                                    key={viewType}
                                    onClick={() => setView(viewType)}
                                    className={`px-2 sm:px-4 py-2.5 rounded-xl capitalize transition-all duration-300 text-xs sm:text-sm font-medium active:scale-95 ${
                                        view === viewType
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                                            : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                                    }`}
                                >
                                    {viewType}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Add Event */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Add Event
                        </button>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:block">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Advanced Calendar</h1>
                                {weather && (
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                                        <span className="text-sm font-medium">{weather.temp}°C</span>
                                        <span className="text-sm">{weather.condition}</span>
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm">{weather.location}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2 rounded-lg transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </button>

                                {/* Settings */}
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2 rounded-lg transition-all duration-300 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    <Settings className="h-5 w-5" />
                                </button>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                                            darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                                        }`}
                                    />
                                </div>

                                {/* Add Event */}
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Event
                                </button>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        {showSettings && (
                            <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-all duration-300`}>
                                <h3 className="text-lg font-semibold mb-3">Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        <label className="text-sm">Notifications</label>
                                        <input
                                            type="checkbox"
                                            checked={notifications}
                                            onChange={(e) => setNotifications(e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <button
                                        onClick={exportEvents}
                                        className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export Events
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        <label className="text-sm">Import Events</label>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={importEvents}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop Navigation and View Toggle */}
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                                {['month', 'week', 'day', 'agenda'].map((viewType) => (
                                    <button
                                        key={viewType}
                                        onClick={() => setView(viewType)}
                                        className={`px-3 md:px-4 py-2 rounded-lg capitalize transition-all duration-300 text-sm md:text-base whitespace-nowrap ${
                                            view === viewType
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                                                : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                                        }`}
                                    >
                                        {viewType}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                {/* Category Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 flex-shrink-0" />
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <option value="all">All Categories</option>
                                        {Object.entries(categories).map(([key, cat]) => (
                                            <option key={key} value={key}>{cat.text}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                    <button onClick={handlePrevMonth} className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <h2 className="text-base md:text-xl lg:text-2xl font-bold text-center min-w-40 md:min-w-48 lg:min-w-64">
                                        {view === 'month' && `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`}
                                        {view === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
                                        {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        {view === 'agenda' && 'All Events'}
                                    </h2>
                                    <button onClick={handleNextMonth} className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Calendar Content */}
                <div className={`${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'} backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    {view === 'month' && (
                        <div className={`relative overflow-hidden rounded-xl border ${darkMode ? 'border-gray-700 bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/40' : 'border-gray-200 bg-gradient-to-br from-white via-blue-50 to-slate-50'}`}>
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.08),transparent_30%)]" />
                            <div className="relative z-10 p-2 md:p-4">
                                <div className={`grid grid-cols-7 text-center font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                        <div key={index} className="p-1 md:p-2 text-xs md:text-sm">{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1 md:gap-2">
                                    {renderMonthView()}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'week' && (
                        <div className="overflow-x-auto">
                            <div className="min-w-full">
                                {renderWeekView()}
                            </div>
                        </div>
                    )}

                    {view === 'day' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                            {renderDayView()}
                        </div>
                    )}

                    {view === 'agenda' && (
                        <div className="max-h-96 overflow-y-auto">
                            {renderAgendaView()}
                        </div>
                    )}
                </div>

                {/* Event Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
                        <div className={`w-full max-w-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 sm:p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-slideUp`}>
                            <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-inherit z-10 pb-2">
                                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    {editingEvent ? 'Edit Event' : 'Add Event'}
                                </h2>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setEventType('task')} 
                                            className={`px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                                                eventType === 'task' 
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                                                    : (darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-95' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95')
                                            }`}
                                        >
                                            Task
                                        </button>
                                        <button 
                                            onClick={() => setEventType('appointment')} 
                                            className={`px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                                                eventType === 'appointment' 
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                                                    : (darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-95' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95')
                                            }`}
                                        >
                                            Appointment
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Category</label>
                                    <select
                                        value={eventCategory}
                                        onChange={(e) => setEventCategory(e.target.value)}
                                        className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        {Object.entries(categories).map(([key, cat]) => (
                                            <option key={key} value={key}>{cat.text}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Title</label>
                                    <input
                                        type="text"
                                        value={eventInput}
                                        onChange={(e) => setEventInput(e.target.value)}
                                        className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                            darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                                        }`}
                                        placeholder="Enter event title"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Time</label>
                                    <div className="flex items-center">
                                        <Clock className={`mr-3 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <input
                                            type="time"
                                            value={eventTime}
                                            onChange={(e) => setEventTime(e.target.value)}
                                            className={`flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Location</label>
                                    <div className="flex items-center">
                                        <MapPin className={`mr-3 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className={`flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                                            }`}
                                            placeholder="Enter location (optional)"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
                                    <textarea
                                        value={eventDescription}
                                        onChange={(e) => setEventDescription(e.target.value)}
                                        className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none ${
                                            darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                                        }`}
                                        placeholder="Enter event description"
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className={`flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        <input
                                            type="checkbox"
                                            checked={recurring}
                                            onChange={(e) => setRecurring(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium">Recurring Event</span>
                                    </label>
                                    {recurring && (
                                        <select
                                            value={recurringType}
                                            onChange={(e) => setRecurringType(e.target.value)}
                                            className={`w-full mt-2 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                                                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    )}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-inherit pb-2">
                                    <button 
                                        onClick={() => setIsModalOpen(false)} 
                                        className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium active:scale-95 ${
                                            darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleAddEvent} 
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base font-medium"
                                    >
                                        {editingEvent ? 'Update Event' : 'Add Event'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Events Modal */}
                {isAllEventsOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
                        <div className={`w-full max-w-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 sm:p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-slideUp`}>
                            <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-inherit z-10 pb-2">
                                <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    Events - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </h2>
                                <button 
                                    onClick={handleCloseAllEvents} 
                                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {events[selectedDate] && events[selectedDate].length > 0 ? (
                                    events[selectedDate].map((event, index) => (
                                        <div key={index} className={`p-3 sm:p-4 rounded-xl shadow-lg ${darkMode ? categories[event.category || 'personal'].darkColor : categories[event.category || 'personal'].color} text-white transform transition-all duration-200 hover:scale-102 active:scale-98`}>
                                            <div className="font-bold text-base sm:text-lg mb-2">{event.title}</div>
                                            <div className="text-xs sm:text-sm opacity-90 flex items-center gap-1 mb-1">
                                                <Clock className="h-3 w-3" />
                                                {event.time}
                                            </div>
                                            {event.location && (
                                                <div className="text-xs sm:text-sm opacity-90 flex items-center gap-1 mb-2">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location}
                                                </div>
                                            )}
                                            <div className="text-xs sm:text-sm opacity-80 mb-3">{event.description}</div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEditEvent(event, selectedDate)} 
                                                    className="flex-1 text-xs sm:text-sm bg-white bg-opacity-20 text-white px-3 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 font-medium"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteEvent(event, selectedDate)} 
                                                    className="flex-1 text-xs sm:text-sm bg-red-500 bg-opacity-80 text-white px-3 py-2 rounded-lg hover:bg-opacity-100 transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 font-medium"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-sm sm:text-base">No events for this date.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;