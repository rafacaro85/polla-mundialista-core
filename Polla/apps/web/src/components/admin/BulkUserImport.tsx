'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BulkUserImportProps {
    leagueId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface UserRow {
    email: string;
    nombre?: string;
    departamento?: string;
}

interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export function BulkUserImport({ leagueId, onClose, onSuccess }: BulkUserImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<ImportResult | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFile(file);
        parseFile(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const parseFile = async (file: File) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

            // Map columns (case insensitive)
            const parsedUsers: UserRow[] = jsonData.map((row: any) => {
                const email = row.email || row.Email || row.correo || row.Correo || '';
                const nombre = row.nombre || row.Nombre || row.name || row.Name || '';
                const departamento = row.departamento || row.Departamento || row.department || row.Department || '';

                return {
                    email: email.trim().toLowerCase(),
                    nombre: nombre.trim(),
                    departamento: departamento.trim()
                };
            }).filter(user => user.email); // Only valid emails

            setUsers(parsedUsers);
            toast.success(`${parsedUsers.length} usuarios detectados en el archivo`);
        } catch (error) {
            console.error('Error parsing file:', error);
            toast.error('Error al leer el archivo', {
                description: 'Verifica que el formato sea correcto'
            });
        }
    };

    const handleImport = async () => {
        if (users.length === 0) {
            toast.error('No hay usuarios para importar');
            return;
        }

        setImporting(true);
        setProgress(0);

        const errors: string[] = [];
        let successCount = 0;

        try {
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                setProgress(Math.round(((i + 1) / users.length) * 100));

                try {
                    await api.post(`/leagues/${leagueId}/participants/bulk`, {
                        email: user.email,
                        fullName: user.nombre || user.email.split('@')[0],
                        department: user.departamento
                    });
                    successCount++;
                } catch (error: any) {
                    errors.push(`${user.email}: ${error.response?.data?.message || 'Error desconocido'}`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const finalResult: ImportResult = {
                total: users.length,
                success: successCount,
                failed: errors.length,
                errors
            };

            setResult(finalResult);

            if (successCount > 0) {
                toast.success(`¡${successCount} usuarios importados exitosamente!`);
                onSuccess();
            }

            if (errors.length > 0) {
                toast.warning(`${errors.length} usuarios no pudieron ser importados`);
            }

        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error durante la importación');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            { email: 'juan.perez@empresa.com', nombre: 'Juan Pérez', departamento: 'Ventas' },
            { email: 'maria.garcia@empresa.com', nombre: 'María García', departamento: 'Marketing' },
            { email: 'carlos.lopez@empresa.com', nombre: 'Carlos López', departamento: 'IT' }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
        XLSX.writeFile(wb, 'plantilla_usuarios.xlsx');

        toast.success('Plantilla descargada');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] border border-blue-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/20">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 border-b border-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <FileSpreadsheet className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Importación Masiva de Usuarios</h2>
                                <p className="text-blue-100 text-sm">Carga participantes desde Excel/CSV</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="text-white" size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Download Template */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Download className="text-blue-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white mb-1">¿Primera vez?</h3>
                                <p className="text-xs text-slate-400 mb-3">
                                    Descarga nuestra plantilla de Excel con el formato correcto
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                                >
                                    Descargar Plantilla →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dropzone */}
                    {!result && (
                        <div
                            {...getRootProps()}
                            className={`
                                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                                ${isDragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5'
                                }
                            `}
                        >
                            <input {...getInputProps()} />
                            <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                            {isDragActive ? (
                                <p className="text-blue-400 font-bold">Suelta el archivo aquí...</p>
                            ) : (
                                <>
                                    <p className="text-white font-bold mb-2">
                                        Arrastra tu archivo Excel o haz click para seleccionar
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        Formatos soportados: .xlsx, .xls, .csv
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* File Info */}
                    {file && !result && (
                        <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="text-blue-400" size={24} />
                                    <div>
                                        <p className="text-white font-bold text-sm">{file.name}</p>
                                        <p className="text-xs text-slate-400">{users.length} usuarios detectados</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setUsers([]);
                                    }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Preview */}
                            {users.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Vista Previa:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {users.slice(0, 5).map((user, i) => (
                                            <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                                <CheckCircle2 size={12} className="text-green-400" />
                                                {user.email} {user.nombre && `- ${user.nombre}`}
                                            </div>
                                        ))}
                                        {users.length > 5 && (
                                            <p className="text-xs text-slate-500">
                                                ... y {users.length - 5} más
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress */}
                    {importing && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Importando usuarios...</span>
                                <span className="text-white font-bold">{progress}%</span>
                            </div>
                            <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-white">{result.total}</p>
                                    <p className="text-xs text-slate-400">Total</p>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-400">{result.success}</p>
                                    <p className="text-xs text-green-400">Exitosos</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-400">{result.failed}</p>
                                    <p className="text-xs text-red-400">Fallidos</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-sm font-bold text-red-400 mb-2">Errores:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {result.errors.map((error, i) => (
                                            <p key={i} className="text-xs text-red-300 flex items-start gap-2">
                                                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                        >
                            {result ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!result && users.length > 0 && (
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Importar {users.length} Usuarios
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
