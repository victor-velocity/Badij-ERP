
const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=👤';

export const employees = Array.from({ length: 20 }, (_, i) => {
    const id = `e${i + 1}`;
    const name = `Employee ${i + 1}`;
    const email = `employee${i + 1}@example.com`;
    let status;
    let timeIn = '-';
    let timeOut = '-';

    if (i % 3 === 0) {
        status = 'On-time';
        timeIn = '08:00 AM';
        timeOut = '05:00 PM';
    } else if (i % 3 === 1) {
        status = 'Late';
        timeIn = '09:30 AM';
        timeOut = '-';
    } else {
        status = 'Absent';
    }

    return {
        id,
        name,
        email,
        avatar: `https://placehold.co/40x40/cccccc/000000?text=E${i + 1}`,
        status,
        timeIn,
        timeOut,
    };
});


const generateFakeShifts = () => {
    const shifts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        if (i === 0) {
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e1', date: dateString, startTime: '01:00 AM', endTime: '03:00 PM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e2', date: dateString, startTime: '04:00 PM', endTime: '07:00 PM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e3', date: dateString, startTime: '08:00 PM', endTime: '10:00 PM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e4', date: dateString, startTime: '11:00 PM', endTime: '12:00 AM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e4', date: dateString, startTime: '11:00 PM', endTime: '12:00 AM' }); // Duplicate for visual
        } else if (i === 1) { // Tomorrow's shifts
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e5', date: dateString, startTime: '09:00 AM', endTime: '05:00 PM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e6', date: dateString, startTime: '10:00 AM', endTime: '06:00 PM' });
        } else { // Other days
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e1', date: dateString, startTime: '09:00 AM', endTime: '05:00 PM' });
            shifts.push({ id: `shift-${shifts.length + 1}`, employeeId: 'e3', date: dateString, startTime: '01:00 PM', endTime: '09:00 PM' });
        }
    }
    return shifts;
};

export const shifts = generateFakeShifts();

// Function to simulate fetching shifts for a specific date
export const getShiftsByDate = (dateString) => {
    return shifts
        .filter(shift => shift.date === dateString)
        .map(shift => {
            const employee = employees.find(emp => emp.id === shift.employeeId);
            return {
                ...shift,
                // Ensure the employee object has name, role, and avatar for display
                employee: employee || { name: 'Unknown', role: 'N/A', avatar: DEFAULT_AVATAR }
            };
        });
};
