"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

const DataManagement = () => {
    const [importFile, setImportFile] = useState(null);
    const [loadingImport, setLoadingImport] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);


    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setImportFile(e.target.files[0]);
        } else {
            setImportFile(null);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Please select a file to import.');
            return;
        }

        setLoadingImport(true);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const csvText = event.target.result;
                    const rows = csvText.split('\n').filter(row => row.trim() !== '');

                    if (rows.length < 2) {
                        toast.error('CSV file must contain at least a header and one row of data.');
                        setLoadingImport(false);
                        return;
                    }

                    const headers = rows[0].split(',').map(header => header.trim().replace(/"/g, ''));
                    
                    const expectedHeaders = [
                        'account_name', 'address', 'bank_account_number', 'bank_name', 'city', 'country',
                        'date_of_birth', 'email', 'employment_status', 'first_name',
                        'gender', 'guarantor_name', 'guarantor_name_2', 'guarantor_phone_number', 'guarantor_phone_number_2', 'last_name', 'marital_status', 'phone_number', 'position', 'state', 'zip_code', 'initial_role', 'password', 'salary', 'incentives', 'bonus', 'compensation', 'hire_date'
                    ];

                    const areHeadersValid = headers.every(h => expectedHeaders.includes(h));
                    if (!areHeadersValid || headers.length !== expectedHeaders.length) {
                        toast.error('CSV headers do not match the expected schema. Please use the provided template.');
                        setLoadingImport(false);
                        return;
                    }

                    const dataToInsert = [];

                    for (let i = 1; i < rows.length; i++) {
                        const values = rows[i].split(',');
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = values[index] ? values[index].trim().replace(/"/g, '') : null;
                        });
                        dataToInsert.push(rowData);
                    }

                    let successfulImports = 0;
                    let failedImports = 0;

                    for (const employeeData of dataToInsert) {
                        try {
                            await apiService.createEmployee(employeeData);
                            successfulImports++;
                        } catch (apiError) {
                            console.error('API create employee error:', apiError);
                            toast.error(`Failed to import a record. Check console for details.`);
                            failedImports++;
                        }
                    }

                    if (failedImports === 0) {
                        toast.success(`Import successful! ${successfulImports} records processed.`);
                    } else {
                        toast.error(`Import finished with errors. ${successfulImports} records imported, ${failedImports} failed.`);
                    }
                    setImportFile(null);
                    e.target.reset();

                } catch (parseError) {
                    console.error('Error parsing CSV file:', parseError);
                    toast.error('An error occurred while parsing the CSV file.');
                } finally {
                    setLoadingImport(false);
                }
            };
            reader.onerror = () => {
                toast.error('Error reading the file.');
                setLoadingImport(false);
            };

            reader.readAsText(importFile);
        } catch (error) {
            console.error('Error during import:', error);
            toast.error('An error occurred during import. Check console for details.');
            setLoadingImport(false);
        }
    };
    
    const exportDataToCsv = async () => {
        setLoadingExport(true);
        try {
            const employees = await apiService.getEmployees();

            if (!employees || employees.length === 0) {
                toast.error('No data available to export.');
                setLoadingExport(false);
                return;
            }

            const headers = [
                'account_name',
                'address',
                'bank_account_number',
                'bank_name',
                'city',
                'country',
                'date_of_birth',
                'departments.name',
                'email',
                'employment_status',
                'first_name',
                'gender',
                'last_name',
                'marital_status',
                'phone_number',
                'position'
            ];

            const csv = [
                headers.join(','),
                ...employees.map(row => {
                    return headers.map(fieldName => {
                        if (fieldName === 'departments.name') {
                            return JSON.stringify(row.departments ? row.departments.name : '');
                        }
                        return JSON.stringify(row[fieldName]);
                    }).join(',');
                })
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'employees_data.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Data exported successfully!');
            } else {
                toast.error('Your browser does not support downloading files directly.');
            }

        } catch (error) {
            console.error('Error during export:', error);
            toast.error('An error occurred during export.');
        } finally {
            setLoadingExport(false);
        }
    };
    
    return (
        <div className="mt-14">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Data Management</h2>

            <div className="mb-8 p-4 border border-solid border-gray-100 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Import Data</h3>
                <p className="text-gray-600 mb-4">
                    Upload a CSV or Excel file to import employee data.
                    <br />
                    <a href="/employee_template.csv" download className="text-[#153087] hover:underline">Download employee template</a> (You need to create this file manually).
                </p>
                <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
                    <input
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    />
                    <button
                        type="submit"
                        disabled={loadingImport || !importFile}
                        className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 self-start"
                    >
                        {loadingImport ? 'Importing...' : 'Upload & Import'}
                    </button>
                </form>
            </div>

            <div className="p-4 border border-solid border-gray-100 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Export Data</h3>
                <p className="text-gray-600 mb-4">
                    Download employee data as a CSV file.
                </p>
                <button
                    onClick={exportDataToCsv}
                    disabled={loadingExport}
                    className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                    {loadingExport ? 'Generating...' : 'Export Employee Data (CSV)'}
                </button>
            </div>
        </div>
    );
};

export default DataManagement;
