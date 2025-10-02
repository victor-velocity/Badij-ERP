import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import apiService from '@/app/lib/apiService';

const TasksTable = ({ tasks, searchTerm, onUpdateTask, loading, error }) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [creators, setCreators] = useState({});
  const [loadingCreators, setLoadingCreators] = useState({});
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Fetch creator details when tasks change
  useEffect(() => {
    const fetchCreators = async () => {
      if (!tasks) return;

      const uniqueCreatorIds = [...new Set(tasks.map(task => task.created_by).filter(Boolean))];
      
      for (const creatorId of uniqueCreatorIds) {
        if (!creators[creatorId] && !loadingCreators[creatorId]) {
          setLoadingCreators(prev => ({ ...prev, [creatorId]: true }));
          
          try {
            const creatorData = await apiService.getEmployeeById(creatorId);
            setCreators(prev => ({ 
              ...prev, 
              [creatorId]: creatorData 
            }));
          } catch (error) {
            console.error(`Failed to fetch creator ${creatorId}:`, error);
            setCreators(prev => ({ 
              ...prev, 
              [creatorId]: { first_name: 'Unknown', last_name: 'User' } 
            }));
          } finally {
            setLoadingCreators(prev => ({ ...prev, [creatorId]: false }));
          }
        }
      }
    };

    fetchCreators();
  }, [tasks]);

  // Safe filtering with null checks
  const filteredTasks = (tasks ?? []).filter(task => {
    if (!task) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    const titleMatch = task.title?.toLowerCase().includes(searchLower) || false;
    const assignedEmployee = task.task_assignments?.[0]?.employees;
    const assignedFirstNameMatch = assignedEmployee?.first_name?.toLowerCase().includes(searchLower) || false;
    const assignedLastNameMatch = assignedEmployee?.last_name?.toLowerCase().includes(searchLower) || false;
    const statusMatch = task.status?.toLowerCase().includes(searchLower) || false;
    const overdueMatch = searchLower.includes('overdue') && isTaskOverdue(task);
    
    return titleMatch || assignedFirstNameMatch || assignedLastNameMatch || statusMatch || overdueMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const safeStatus = status || 'Unknown';
    
    switch (safeStatus.toLowerCase()) {
      case 'completed':
        return 'text-green-500 bg-green-100';
      case 'in progress':
        return 'text-yellow-500 bg-yellow-100';
      case 'pending':
        return 'text-blue-500 bg-blue-100';
      case 'cancelled':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    const safePriority = priority || 'Unknown';
    
    switch (safePriority.toLowerCase()) {
      case 'high':
        return 'text-red-500 bg-red-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'low':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getOverdueStatus = (task) => {
    if (task.status === 'Completed') {
      return { isOverdue: false, text: 'Completed' };
    }
    
    const isOverdue = isTaskOverdue(task);
    return { 
      isOverdue, 
      text: isOverdue ? 'Overdue' : 'On Track' 
    };
  };

  const getOverdueColor = (overdueStatus) => {
    if (overdueStatus.text === 'Completed') {
      return 'text-green-500 bg-green-100';
    }
    return overdueStatus.isOverdue 
      ? 'text-red-500 bg-red-100' 
      : 'text-green-500 bg-green-100';
  };

  const isTaskOverdue = (task) => {
    if (!task.end_date || task.status === 'Completed' || task.status === 'Cancelled') return false;
    
    try {
      const endDate = new Date(task.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate < today;
    } catch {
      return false;
    }
  };

  const getAssignedEmployeeName = (task) => {
    const assignment = task.task_assignments?.[0];
    if (!assignment || !assignment.employees) return 'Unassigned';
    
    const { first_name, last_name } = assignment.employees;
    return `${first_name || ''} ${last_name || ''}`.trim() || 'Unassigned';
  };

  const getCreatorName = (task) => {
    if (!task.created_by) return 'N/A';
    
    const creator = creators[task.created_by];
    
    if (loadingCreators[task.created_by]) {
      return 'Loading...';
    }
    
    if (!creator) {
      return 'Unknown User';
    }
    
    return `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Unknown User';
  };

  const handleViewClick = (task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTask(null);
  };

  const handleStatusUpdate = async (task, newStatus) => {
    setUpdatingTaskId(task.id);
    try {
      await apiService.updateTask(task.id, { status: newStatus });
      
      if (onUpdateTask) {
        await onUpdateTask();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case 'pending':
        return 'In Progress';
      case 'in progress':
        return 'Completed';
      default:
        return 'Completed';
    }
  };

  const getSubmitButtonText = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case 'pending':
        return 'Start Task';
      case 'in progress':
        return 'Mark Complete';
      default:
        return 'Submit';
    }
  };

  if (loading) {
    return (
      <div className="overflow-x-auto bg-white rounded-md shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="animate-pulse">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-md shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const overdueStatus = getOverdueStatus(task);
                const nextStatus = getNextStatus(task.status);
                const submitButtonText = getSubmitButtonText(task.status);
                const isUpdating = updatingTaskId === task.id;
                
                return (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title || 'Untitled Task'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getAssignedEmployeeName(task)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCreatorName(task)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOverdueColor(overdueStatus)}`}>
                        {overdueStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewClick(task)} 
                          className="text-gray-500 hover:text-indigo-900"
                          title="View task"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        {task.status === 'Completed' || task.status === 'Cancelled' ? (
                          <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md">
                            {task.status}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusUpdate(task, nextStatus)}
                            disabled={isUpdating}
                            className="px-3 py-1 text-sm font-medium text-white bg-[#b88b1b] rounded-md hover:bg-[#a67c15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Updating...' : submitButtonText}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No tasks match your search.' : 'No tasks found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Task Modal */}
      {isViewModalOpen && selectedTask && (
        <ViewTaskModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          task={selectedTask}
          creatorName={getCreatorName(selectedTask)}
          onStatusUpdate={handleStatusUpdate}
          updatingTaskId={updatingTaskId}
        />
      )}
    </>
  );
};

// View Task Modal Component
const ViewTaskModal = ({ isOpen, onClose, task, creatorName, onStatusUpdate, updatingTaskId }) => {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const safeStatus = status || 'Unknown';
    switch (safeStatus.toLowerCase()) {
      case 'completed':
        return 'text-green-500 bg-green-100';
      case 'in progress':
        return 'text-yellow-500 bg-yellow-100';
      case 'pending':
        return 'text-blue-500 bg-blue-100';
      case 'cancelled':
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    const safePriority = priority || 'Unknown';
    switch (safePriority.toLowerCase()) {
      case 'high':
        return 'text-red-500 bg-red-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'low':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case 'pending':
        return 'In Progress';
      case 'in progress':
        return 'Completed';
      default:
        return 'Completed';
    }
  };

  const getSubmitButtonText = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case 'pending':
        return 'Start Task';
      case 'in progress':
        return 'Mark Complete';
      default:
        return 'Submit';
    }
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(currentStatus);
    await onStatusUpdate(task, nextStatus);
    setCurrentStatus(nextStatus);
  };

  const isUpdating = updatingTaskId === task.id;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Task Title and Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title || 'Untitled Task'}</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Task Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(currentStatus)}`}>
                      {currentStatus || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1">
                    <span className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="mt-1 text-lg text-gray-900 font-medium">{formatDate(task.start_date)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="mt-1 text-lg text-gray-900 font-medium">{formatDate(task.end_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="mt-1 text-lg text-gray-900 font-medium">
                    {task.task_assignments?.[0]?.employees ? 
                      `${task.task_assignments[0].employees.first_name || ''} ${task.task_assignments[0].employees.last_name || ''}`.trim() || 'Unassigned' : 
                      'Unassigned'
                    }
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="mt-1 text-lg text-gray-900 font-medium">{creatorName}</p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {(task.task_documents && task.task_documents.length > 0) ? (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Attached Documents</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {task.task_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.name || `Document ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.type || 'File'}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Attached Documents</h4>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No documents attached to this task</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {currentStatus !== 'Completed' && currentStatus !== 'Cancelled' && (
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                className="px-6 py-2 text-sm font-medium text-white bg-[#b88b1b] rounded-md hover:bg-[#a67c15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : getSubmitButtonText(currentStatus)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksTable;