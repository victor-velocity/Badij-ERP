import React, { useState, useEffect } from 'react';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=👤';

const employeesData = Array.from({ length: 20 }, (_, i) => {
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

const getAttendanceSummary = (currentEmployees) => {
    const onTime = currentEmployees.filter(emp => emp.status === 'On-time').length;
    const late = currentEmployees.filter(emp => emp.status === 'Late').length;
    const absent = currentEmployees.filter(emp => emp.status === 'Absent').length;
    return { onTime, late, absent };
};

const EmployeeRow = ({ employee, getStatusColor }) => {
    const [imgSrc, setImgSrc] = useState(employee.avatar);
    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        <img
                            className="h-full w-full object-cover rounded-full"
                            src={imgSrc}
                            alt={`${employee.name}'s avatar`}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.timeIn}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.timeOut}
            </td>
        </tr>
    );
};

const Attendance = () => {
    const [filterType, setFilterType] = useState('Day');
    const [displayedEmployees, setDisplayedEmployees] = useState([]);
    const displayLimit = 10;

    useEffect(() => {
        let filteredData = [];
        switch (filterType) {
            case 'Day':
                filteredData = employeesData.slice(0, displayLimit);
                break;
            case 'Week':
                filteredData = employeesData.slice(5, 5 + displayLimit);
                break;
            case 'Month':
                filteredData = employeesData.slice(10, 10 + displayLimit);
                break;
            default:
                filteredData = employeesData.slice(0, displayLimit);
        }
        setDisplayedEmployees(filteredData);
    }, [filterType]);

    const { onTime, late, absent } = getAttendanceSummary(displayedEmployees);

    const getStatusColor = (status) => {
        switch (status) {
            case 'On-time':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-red-100 text-red-800';
            case 'Absent':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        // Add max-h-screen or a specific max-height, and overflow-y-auto
        // Corrected max-w-[80vw] typo
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] my-8 shadow-md sm:rounded-lg rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time in
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time out
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {displayedEmployees.map((employee) => (
                        <EmployeeRow key={employee.id} employee={employee} getStatusColor={getStatusColor} />
                    ))}
                </tbody>
            </table>
            {displayedEmployees.length === 0 && (
                <p className="text-center py-4 text-gray-500">No attendance data for this period.</p>
            )}
        </div>
    );
};

export default Attendance;