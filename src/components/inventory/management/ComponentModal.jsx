import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { createClient } from '@/app/lib/supabase/client';

const supabase = createClient();

const goldColor = '#b88b1b';

const ComponentModal = ({ type, component, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        component_image: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (type === 'edit' && component) {
            setFormData({
                sku: component.sku || '',
                name: component.name || '',
                description: component.description || '',
                color: component.color || '',
                component_image: component.component_image || ''
            });
        } else if (type === 'add') {
            setFormData({
                sku: '',
                name: '',
                description: '',
                color: '',
                component_image: ''
            });
        }
    }, [type, component]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `component-image/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('component-image')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('component-image')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            toast.error('Failed to upload image');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            let imageUrl = formData.component_image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
                if (!imageUrl) {
                    setSaving(false);
                    return;
                }
            }

            const updatedFormData = {
                ...formData,
                component_image: imageUrl
            };

            await onSave(updatedFormData);
        } catch (error) {
            toast.error('Failed to process form');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full overflow-y-auto max-h-[80vh] relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    disabled={saving || uploading}
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
                
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: goldColor }}>
                    {type === 'add' ? 'Add Component' : 'Edit Component'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Store Keeping Unit (SKU)</label>
                            <input 
                                type="text" 
                                name="sku" 
                                value={formData.sku} 
                                onChange={handleChange} 
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition duration-200" 
                                required 
                                disabled={saving || uploading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Component Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition duration-200" 
                                required 
                                disabled={saving || uploading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition duration-200" 
                                rows="3"
                                disabled={saving || uploading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Color</label>
                            <input
                                type="text"
                                name="color"
                                value={formData.color || ''}
                                onChange={handleChange}
                                placeholder="e.g. Black, Blue Mesh, White"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition duration-200"
                                disabled={saving || uploading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Component Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition duration-200 file:bg-[#b88b1b] file:p-3 file:text-white file:mr-4" 
                                disabled={saving || uploading}
                            />
                            {formData.component_image && (
                                <img src={formData.component_image} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-md" />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                            disabled={saving || uploading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 text-white rounded-md hover:opacity-90 transition duration-200 disabled:opacity-50"
                            style={{ backgroundColor: goldColor }}
                            disabled={saving || uploading}
                        >
                            {saving ? 'Saving...' : uploading ? 'Uploading...' : type === 'add' ? 'Add Component' : 'Update Component'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComponentModal;