"use client";

import React, { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

const DataManagement = () => {
    const [importFile, setImportFile] = useState(null);
    const [importStatus, setImportStatus] = useState('');
    const [exportStatus, setExportStatus] = useState('');
    const [loadingImport, setLoadingImport] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);

    const supabase = createClient()

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setImportFile(e.target.files[0]);
        } else {
            setImportFile(null);
        }
        setImportStatus('');
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            setImportStatus('Please select a file to import.');
            return;
        }

        setLoadingImport(true);
        setImportStatus('Importing data...');

        // IMPORTANT: For robust import, you should send this file to a backend API route
        // for parsing, validation, and secure database insertion.
        // Example: Using a Next.js API route or Supabase Edge Function
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('dataType', 'employees'); // Could be 'employees', 'users', etc.

        try {
            // Replace '/api/import-data' with your actual backend API endpoint
            // This backend endpoint would read the CSV, validate it, and insert into Supabase
            const response = await fetch('/api/import-data', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                setImportStatus(`Import successful! ${result.importedCount} records processed. Errors: ${result.errorCount}`);
                setImportFile(null); // Clear file input
                e.target.reset(); // Reset the form to clear file input visual
            } else {
                const errorData = await response.json();
                setImportStatus(`Import failed: ${errorData.message || 'An unknown error occurred.'}`);
            }
        } catch (error) {
            console.error('Error during import:', error);
            setImportStatus('An error occurred during import. Check console for details.');
        } finally {
            setLoadingImport(false);
        }
    };

    // --- Export Functions ---
    const exportDataToCsv = async () => {
        setLoadingExport(true);
        setExportStatus('Exporting data...');

        try {
            // Example: Exporting 'employees' data
            const { data: employees, error } = await supabase
                .from('employees') // Adjust table name if you want to export other data
                .select('*'); // Select all columns

            if (error) {
                console.error('Error fetching data for export:', error.message);
                setExportStatus('Failed to fetch data for export.');
                setLoadingExport(false);
                return;
            }

            if (!employees || employees.length === 0) {
                setExportStatus('No data available to export.');
                setLoadingExport(false);
                return;
            }

            // Generate CSV string
            const headers = Object.keys(employees[0]);
            const csv = [
                headers.join(','), // CSV Headers
                ...employees.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(',')) // CSV Rows
            ].join('\n');

            // Create a Blob and download it
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) { // Feature detection for download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'employees_data.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportStatus('Data exported successfully!');
            } else {
                setExportStatus('Your browser does not support downloading files directly.');
            }

        } catch (error) {
            console.error('Error during export:', error);
            setExportStatus('An error occurred during export.');
        } finally {
            setLoadingExport(false);
        }
    };

    return (
        <div className=" mt-14">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Data Management</h2>

            {/* Import Section */}
            <div className="mb-8 p-4 border border-solid border-gray-100 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Import Data</h3>
                <p className="text-gray-600 mb-4">
                    Upload a CSV or Excel file to import employee data.
                    <br />
                    <a href="/employee_template.csv" download className="text-yellow-600 hover:underline">Download employee template</a> (You need to create this file manually).
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
                    {importStatus && <p className={`text-sm ${importStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{importStatus}</p>}
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
                {exportStatus && <p className={`text-sm ${exportStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{exportStatus}</p>}
            </div>
        </div>
    );
};

export default DataManagement;