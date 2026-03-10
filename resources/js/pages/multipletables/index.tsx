import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fitness Dashboard',
        href: '/multipletables',
    },
];

export default function Index() {
    // State for active tab
    const [activeTab, setActiveTab] = useState('workouts');
    
    // State for different data tables
    const [workouts, setWorkouts] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Loading states
    const [loading, setLoading] = useState({
        workouts: true,
        exercises: true,
        users: true
    });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        load: '',
        reps: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Fetch all data when component mounts
    useEffect(() => {
        fetchWorkouts();
        fetchExercises();
        fetchUsers();
    }, []);

    // Fetch workouts from backend
    const fetchWorkouts = async () => {
        try {
            const response = await fetch('/api/workouts');
            const data = await response.json();
            setWorkouts(data);
        } catch (error) {
            console.error('Error fetching workouts:', error);
        } finally {
            setLoading(prev => ({ ...prev, workouts: false }));
        }
    };

    // Fetch exercises (mock data)
    const fetchExercises = async () => {
        try {
            setTimeout(() => {
                const mockExercises = [
                    { _id: '1', name: 'Push-ups', muscleGroup: 'Chest', difficulty: 'Beginner', equipment: 'None' },
                    { _id: '2', name: 'Pull-ups', muscleGroup: 'Back', difficulty: 'Intermediate', equipment: 'Bar' },
                    { _id: '3', name: 'Squats', muscleGroup: 'Legs', difficulty: 'Beginner', equipment: 'None' },
                    { _id: '4', name: 'Deadlifts', muscleGroup: 'Back', difficulty: 'Advanced', equipment: 'Barbell' },
                    { _id: '5', name: 'Bench Press', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Barbell' },
                ];
                setExercises(mockExercises);
                setLoading(prev => ({ ...prev, exercises: false }));
            }, 1000);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            setLoading(prev => ({ ...prev, exercises: false }));
        }
    };

    // Fetch users (mock data)
    const fetchUsers = async () => {
        try {
            setTimeout(() => {
                const mockUsers = [
                    { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
                    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
                    { _id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Trainer' },
                    { _id: '5', name: 'Mike Wilson', email: 'mike@example.com', role: 'User' },
                ];
                setUsers(mockUsers);
                setLoading(prev => ({ ...prev, users: false }));
            }, 1500);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');

        try {
            const response = await fetch('/api/workouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to add workout');
            }
            
            const newWorkout = await response.json();
            setWorkouts(prev => [...prev, newWorkout]);
            
            // Reset form
            setFormData({ title: '', load: '', reps: '' });
            
            // Switch to workouts tab to show the new entry
            setActiveTab('workouts');
        } catch (error) {
            setFormError('Failed to add workout. Please try again.');
            console.error('Error adding workout:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Table component
    const DataTable = ({ title, data, columns, isLoading, accentColor = '#4CAF50' }) => {
        if (isLoading) {
            return (
                <div className="table-wrapper">
                    <h2 style={{ borderBottomColor: accentColor }}>{title}</h2>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading {title.toLowerCase()}...</p>
                    </div>
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="table-wrapper">
                    <h2 style={{ borderBottomColor: accentColor }}>{title}</h2>
                    <div className="empty-state">
                        <p>No {title.toLowerCase()} found</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="table-wrapper">
                <h2 style={{ borderBottomColor: accentColor }}>{title}</h2>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item._id}>
                                    {columns.map(col => (
                                        <td key={col.key}>
                                            {col.render ? col.render(item[col.key]) : item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Column definitions
    const workoutColumns = [
        { key: 'title', label: 'Workout Name' },
        { key: 'load', label: 'Load (kg)' },
        { key: 'reps', label: 'Reps' },
    ];

    const exerciseColumns = [
        { key: 'name', label: 'Exercise' },
        { key: 'muscleGroup', label: 'Muscle Group' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'equipment', label: 'Equipment' }
    ];

    const userColumns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { 
            key: 'role', 
            label: 'Role',
            render: (value) => (
                <span className={`role-badge ${value.toLowerCase()}`}>
                    {value}
                </span>
            )
        }
    ];

    // Render the active table based on selected tab
    const renderActiveTable = () => {
        switch(activeTab) {
            case 'workouts':
                return (
                    <DataTable 
                        title="Workouts"
                        data={workouts}
                        columns={workoutColumns}
                        isLoading={loading.workouts}
                        accentColor="#4CAF50"
                    />
                );
            case 'exercises':
                return (
                    <DataTable 
                        title="Exercises"
                        data={exercises}
                        columns={exerciseColumns}
                        isLoading={loading.exercises}
                        accentColor="#FF9800"
                    />
                );
            case 'users':
                return (
                    <DataTable 
                        title="Users"
                        data={users}
                        columns={userColumns}
                        isLoading={loading.users}
                        accentColor="#f44336"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fitness Dashboard" />
            <div className="@container/main flex flex-1 flex-col gap-4 p-4">
                {/* Tabs Navigation */}
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-button ${activeTab === 'workouts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workouts')}
                        >
                            <span className="tab-icon">💪</span>
                            Workouts
                            {workouts.length > 0 && (
                                <span className="tab-count">{workouts.length}</span>
                            )}
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'exercises' ? 'active' : ''}`}
                            onClick={() => setActiveTab('exercises')}
                        >
                            <span className="tab-icon">🏋️</span>
                            Exercises
                            {exercises.length > 0 && (
                                <span className="tab-count">{exercises.length}</span>
                            )}
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <span className="tab-icon">👥</span>
                            Users
                            {users.length > 0 && (
                                <span className="tab-count">{users.length}</span>
                            )}
                        </button>
                    </div>
                    <div className="tab-indicator" style={{
                        transform: `translateX(${activeTab === 'workouts' ? '0' : activeTab === 'exercises' ? '100%' : '200%'})`
                    }} />
                </div>

                {/* Active Table Content */}
                <div className="tab-content">
                    {renderActiveTable()}
                </div>
            </div>
        </AppLayout>
    );
}