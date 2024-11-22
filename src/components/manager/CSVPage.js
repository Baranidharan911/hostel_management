import React, { useState } from 'react';
import Papa from 'papaparse';
import { CSVLink } from 'react-csv';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/CSVPage.css';

const CSVPage = () => {
    const [data, setData] = useState([]);
    const [editedData, setEditedData] = useState([]);
    const [newHeader, setNewHeader] = useState('');
    const [newRow, setNewRow] = useState({});
    const [originalCsv, setOriginalCsv] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOriginalCsv(file);
            Papa.parse(file, {
                complete: (result) => {
                    setData(result.data);
                    setEditedData(result.data);
                },
                header: true
            });
        }
    };

    const handleCellChange = (rowIndex, columnIndex, value) => {
        const updatedData = editedData.map((row, index) => {
            if (index === rowIndex) {
                return {
                    ...row,
                    [Object.keys(row)[columnIndex]]: value
                };
            }
            return row;
        });
        setEditedData(updatedData);
    };

    const handleHeaderChange = (columnIndex, value) => {
        const updatedData = editedData.map(row => {
            const updatedRow = { ...row };
            const key = Object.keys(updatedRow)[columnIndex];
            updatedRow[value] = updatedRow[key];
            delete updatedRow[key];
            return updatedRow;
        });
        setEditedData(updatedData);
    };

    const handleAddHeader = () => {
        if (newHeader) {
            const updatedData = editedData.map(row => ({ ...row, [newHeader]: '' }));
            setEditedData(updatedData);
            setNewHeader('');
        }
    };

    const handleAddRow = () => {
        const updatedData = [...editedData, newRow];
        setEditedData(updatedData);
        setNewRow({});
    };

    const handleNewRowChange = (key, value) => {
        setNewRow(prevState => ({ ...prevState, [key]: value }));
    };

    const headers = data.length > 0 ? Object.keys(data[0]).map((key, index) => ({ label: key, key })) : [];

    return (
        <ManagerLayout>
            <div className="csv-page-container">
                <h2>CSV Upload and Export</h2>
                <input type="file" accept=".csv" onChange={handleFileUpload} />
                {data.length > 0 && (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index}>
                                            <input
                                                type="text"
                                                value={header.label}
                                                onChange={(e) => handleHeaderChange(index, e.target.value)}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {editedData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {Object.keys(row).map((key, columnIndex) => (
                                            <td key={columnIndex}>
                                                <input
                                                    type="text"
                                                    value={row[key]}
                                                    onChange={(e) => handleCellChange(rowIndex, columnIndex, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    {headers.map((header, index) => (
                                        <td key={index}>
                                            <input
                                                type="text"
                                                placeholder={`Add ${header.label}`}
                                                value={newRow[header.key] || ''}
                                                onChange={(e) => handleNewRowChange(header.key, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                    <td>
                                        <button onClick={handleAddRow}>Add Row</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="add-header">
                            <input
                                type="text"
                                placeholder="New Header"
                                value={newHeader}
                                onChange={(e) => setNewHeader(e.target.value)}
                            />
                            <button onClick={handleAddHeader}>Add Header</button>
                        </div>
                        <CSVLink
                            data={editedData}
                            headers={headers}
                            filename={"edited_data.csv"}
                            className="btn btn-primary"
                        >
                            Export Edited CSV
                        </CSVLink>
                        {originalCsv && (
                            <CSVLink
                                data={data}
                                headers={headers}
                                filename={originalCsv.name}
                                className="btn btn-secondary"
                                style={{ marginTop: '10px' }}
                            >
                                Export Original CSV
                            </CSVLink>
                        )}
                    </>
                )}
            </div>
        </ManagerLayout>
    );
};

export default CSVPage;
