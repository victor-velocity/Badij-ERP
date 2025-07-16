"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import toast from 'react-hot-toast';

const supabase = createClient();

const AddEmployeeModal = ({ isOpen, onClose, onEmployeeAdded }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [newEmployee, setNewEmployee] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Nigeria',
        date_of_birth: '',
        hire_date: '',
        employment_status: 'Active',
        position_id: '',
        department_id: '',
        location_id: '', // Added location_id
        guarantor_name: '',
        guarantor_phone_number: '',
        guarantor_name_2: '',
        guarantor_phone_number_2: '',
        salary: '',
        compensation: '',
        incentive: '',
        bonus: '',
        marital_status: '',
        bank_account_number: '',
        bank_name: '',
        account_name: '',
        gender: '',
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

    const [documentFiles, setDocumentFiles] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);

    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(null);

    const [loading, setLoading] = useState(false);

    const [positions, setPositions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]); // New state for locations

    const avatarInputRef = useRef(null);
    const documentsInputRef = useRef(null);
    const signatureInputRef = useRef(null);

    const modalContentRef = useRef(null);

    // Fetch positions, departments, and locations from Supabase
    useEffect(() => {
        if (isOpen) {
            const fetchLookupData = async () => {
                setLoading(true);
                try {
                    const { data: positionsData, error: positionsError } = await supabase
                        .from('positions')
                        .select('id, title as position_name');
                    if (positionsError) throw positionsError;
                    setPositions(positionsData);

                    const { data: departmentsData, error: departmentsError } = await supabase
                        .from('departments')
                        .select('id, name as department_name');
                    if (departmentsError) throw departmentsError;
                    setDepartments(departmentsData);

                    const { data: locationsData, error: locationsError } = await supabase
                        .from('locations') // Assuming your locations table is named 'locations'
                        .select('id, name as location_name'); // Assuming 'name' column for location name
                    if (locationsError) throw locationsError;
                    setLocations(locationsData);

                } catch (error) {
                    console.error('Error fetching lookup data:', error.message);
                    toast.error('Failed to load positions, departments, or locations.');
                } finally {
                    setLoading(false);
                }
            };
            fetchLookupData();
        }
    }, [isOpen]);

    // Validates all required fields before submission
    const validateAllFields = useCallback(() => {
        const requiredFields = {
            1: ['first_name', 'last_name', 'email', 'date_of_birth', 'marital_status', 'gender'],
            2: ['phone_number', 'address', 'city', 'state', 'country'],
            3: ['hire_date', 'position_id', 'department_id', 'location_id', 'guarantor_name', 'guarantor_phone_number', 'guarantor_name_2', 'guarantor_phone_number_2'], // Added location_id
            4: ['salary', 'compensation', 'incentive', 'bonus', 'bank_account_number', 'bank_name', 'account_name'],
        };

        let isValid = true;
        let missingFields = [];

        for (const step in requiredFields) {
            requiredFields[step].forEach(field => {
                if (!newEmployee[field]) {
                    missingFields.push(field.replace(/_/g, ' '));
                    isValid = false;
                }
            });
        }

        if (!isValid) {
            toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(newEmployee.email)) {
            toast.error('Please enter a valid email address.');
            return false;
        }

        const numericFields = ['salary', 'compensation', 'incentive', 'bonus'];
        for (const field of numericFields) {
            if (isNaN(parseFloat(newEmployee[field])) || parseFloat(newEmployee[field]) < 0) {
                toast.error(`${field.replace(/_/g, ' ')} must be a non-negative number.`);
                return false;
            }
        }

        if (parseFloat(newEmployee.salary) <= 0) {
            toast.error('Salary must be a positive number.');
            return false;
        }

        if (!avatarFile) {
            toast.error('Please upload an employee photo.');
            return false;
        }

        if (!signatureFile) {
            toast.error('Please upload a scanned copy of the signature.');
            return false;
        }

        return true;
    }, [newEmployee, avatarFile, signatureFile]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreviewUrl(URL.createObjectURL(file));
        } else {
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
        }
    };

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSignatureFile(file);
            setSignaturePreviewUrl(URL.createObjectURL(file));
        } else {
            setSignatureFile(null);
            setSignaturePreviewUrl(null);
        }
    };

    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files);
        setDocumentFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type
        }));
        setDocumentPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeDocument = (indexToRemove) => {
        setDocumentFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setDocumentPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const generateDefaultPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const uploadFileToSupabase = async (file, bucketName, folderPath) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folderPath}/${fileName}`;
        const { error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`Error uploading file to ${bucketName}:`, error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const handleStepClick = (step) => {
        setCurrentStep(step);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!validateAllFields()) {
            setLoading(false);
            return;
        }

        const defaultPassword = generateDefaultPassword();
        const employeeEmail = newEmployee.email;
        const employeeFullName = `${newEmployee.first_name} ${newEmployee.last_name}`;

        let avatarUrl = null;
        let signatureUrl = null;
        let documentUrls = [];

        try {
            if (avatarFile) {
                avatarUrl = await uploadFileToSupabase(avatarFile, 'avatars', 'employee_avatars');
            }

            if (signatureFile) {
                signatureUrl = await uploadFileToSupabase(signatureFile, 'signatures', 'employee_signatures');
            }

            if (documentFiles.length > 0) {
                const uploadPromises = documentFiles.map(file =>
                    uploadFileToSupabase(file, 'documents', 'employee_documents')
                );
                documentUrls = await Promise.all(uploadPromises);
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: employeeEmail,
                password: defaultPassword,
                options: {
                    data: {
                        full_name: employeeFullName,
                        role: 'employee'
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    const { data: existingUser, error: existingUserError } = await supabase.auth.signInWithPassword({
                        email: employeeEmail,
                        password: defaultPassword,
                    });
                    if (existingUserError && existingUserError.message.includes('Invalid login credentials')) {
                        toast.error(`User with this email already exists but cannot be assigned with the default password. Please use a different email or reset the existing user's password manually in Supabase Auth.`);
                        setLoading(false);
                        return;
                    } else if (existingUserError) {
                        toast.error(`Error checking existing user: ${existingUserError.message}`);
                        setLoading(false);
                        return;
                    }
                    authData.user = existingUser.user;
                } else {
                    toast.error(`Failed to create user account: ${authError.message}`);
                    setLoading(false);
                    return;
                }
            }

            const userId = authData.user?.id;

            if (!userId) {
                toast.error("Failed to get user ID after authentication.");
                setLoading(false);
                return;
            }

            const employeeDataToInsert = {
                user_id: userId,
                first_name: newEmployee.first_name,
                last_name: newEmployee.last_name,
                email: newEmployee.email,
                phone_number: newEmployee.phone_number,
                address: newEmployee.address,
                city: newEmployee.city,
                state: newEmployee.state,
                zip_code: newEmployee.zip_code || null,
                country: newEmployee.country,
                date_of_birth: newEmployee.date_of_birth,
                hire_date: newEmployee.hire_date,
                employment_status: 'Active',
                position_id: newEmployee.position_id,
                department_id: newEmployee.department_id,
                location_id: newEmployee.location_id,
                guarantor_name: newEmployee.guarantor_name,
                guarantor_phone_number: newEmployee.guarantor_phone_number,
                guarantor_name_2: newEmployee.guarantor_name_2,
                guarantor_phone_number_2: newEmployee.guarantor_phone_number_2,
                salary: parseFloat(newEmployee.salary),
                compensation: parseFloat(newEmployee.compensation),
                incentive: parseFloat(newEmployee.incentive),
                bonus: parseFloat(newEmployee.bonus),
                marital_status: newEmployee.marital_status,
                bank_account_number: newEmployee.bank_account_number,
                bank_name: newEmployee.bank_name,
                account_name: newEmployee.account_name,
                gender: newEmployee.gender,
                avatar_url: avatarUrl,
                signature_url: signatureUrl,
                document_urls: documentUrls,
            };

            const { error: dbError } = await supabase
                .from('employees')
                .insert([employeeDataToInsert]);

            if (dbError) {
                console.error('Error adding employee to database:', dbError);
                toast.error(`Failed to add employee details: ${dbError.message}`);
            } else {
                toast.success('Employee registered and added successfully! Email with login details is being sent...');

                setTimeout(() => {
                    onEmployeeAdded();
                    onClose();
                    setNewEmployee({
                        first_name: '', last_name: '', email: '', phone_number: '', address: '', city: '', state: '', zip_code: '', country: 'Nigeria', date_of_birth: '', hire_date: '', employment_status: 'Active', position_id: '', department_id: '', location_id: '', // Reset location_id
                        guarantor_name: '', guarantor_phone_number: '', guarantor_name_2: '', guarantor_phone_number_2: '',
                        salary: '', compensation: '', incentive: '', bonus: '', marital_status: '', bank_account_number: '', bank_name: '', account_name: '', gender: ''
                    });
                    setAvatarFile(null);
                    setAvatarPreviewUrl(null);
                    setSignatureFile(null);
                    setSignaturePreviewUrl(null);
                    setDocumentFiles([]);
                    setDocumentPreviews([]);
                    setCurrentStep(1);
                    if (avatarInputRef.current) avatarInputRef.current.value = '';
                    if (documentsInputRef.current) documentsInputRef.current.value = '';
                    if (signatureInputRef.current) signatureInputRef.current.value = '';
                }, 2500);
            }
        } catch (err) {
            console.error('Unexpected error during employee registration or file upload:', err);
            toast.error(`An unexpected error occurred: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-black mb-4">1. Personal Information</h3>
                        <div className="md:col-span-2 flex flex-col items-center mb-4">
                            <label htmlFor="avatar" className="block text-sm font-medium text-black mb-2">
                                Employee Photo <span className="text-[#b88b1b]">*</span>
                            </label>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center mb-3">
                                {avatarPreviewUrl ? (
                                    <img src={avatarPreviewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                    </svg>
                                )}
                            </div>
                            <input
                                type="file"
                                id="avatar"
                                name="avatar"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                ref={avatarInputRef}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[#b88b1b] file:text-white
                                    hover:file:bg-[#997417] cursor-pointer"
                            />
                        </div>

                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-black mb-1">
                                First Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={newEmployee.first_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-black mb-1">
                                Last Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={newEmployee.last_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                                Email <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={newEmployee.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-black mb-1">
                                Date of Birth <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="date"
                                id="date_of_birth"
                                name="date_of_birth"
                                value={newEmployee.date_of_birth}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="marital_status" className="block text-sm font-medium text-black mb-1">
                                Marital Status <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="marital_status"
                                name="marital_status"
                                value={newEmployee.marital_status}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Marital Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-black mb-1">
                                Gender <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={newEmployee.gender}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-black mb-4">2. Address Information</h3>
                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium text-black mb-1">
                                Phone Number <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={newEmployee.phone_number}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                                Address <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={newEmployee.address}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-black mb-1">
                                City <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={newEmployee.city}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-black mb-1">
                                State <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="state"
                                name="state"
                                value={newEmployee.state}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select a State</option>
                                <option value="Abia">Abia</option>
                                <option value="Adamawa">Adamawa</option>
                                <option value="Akwa Ibom">Akwa Ibom</option>
                                <option value="Anambra">Anambra</option>
                                <option value="Bauchi">Bauchi</option>
                                <option value="Bayelsa">Bayelsa</option>
                                <option value="Benue">Benue</option>
                                <option value="Borno">Borno</option>
                                <option value="Cross River">Cross River</option>
                                <option value="Delta">Delta</option>
                                <option value="Ebonyi">Ebonyi</option>
                                <option value="Edo">Edo</option>
                                <option value="Ekiti">Ekiti</option>
                                <option value="Enugu">Enugu</option>
                                <option value="Gombe">Gombe</option>
                                <option value="Imo">Imo</option>
                                <option value="Jigawa">Jigawa</option>
                                <option value="Kaduna">Kaduna</option>
                                <option value="Kano">Kano</option>
                                <option value="Katsina">Katsina</option>
                                <option value="Kebbi">Kebbi</option>
                                <option value="Kogi">Kogi</option>
                                <option value="Kwara">Kwara</option>
                                <option value="Lagos">Lagos</option>
                                <option value="Nasarawa">Nasarawa</option>
                                <option value="Niger">Niger</option>
                                <option value="Ogun">Ogun</option>
                                <option value="Ondo">Ondo</option>
                                <option value="Osun">Osun</option>
                                <option value="Oyo">Oyo</option>
                                <option value="Plateau">Plateau</option>
                                <option value="Rivers">Rivers</option>
                                <option value="Sokoto">Sokoto</option>
                                <option value="Taraba">Taraba</option>
                                <option value="Yobe">Yobe</option>
                                <option value="Zamfara">Zamfara</option>
                                <option value="FCT">FCT</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="zip_code" className="block text-sm font-medium text-black mb-1">
                                Zip Code
                            </label>
                            <input
                                type="text"
                                id="zip_code"
                                name="zip_code"
                                value={newEmployee.zip_code}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-black mb-1">
                                Country <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                value={newEmployee.country}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-black mb-4">3. Employment & Guarantor Information</h3>
                        <div>
                            <label htmlFor="hire_date" className="block text-sm font-medium text-black mb-1">
                                Hire Date <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="date"
                                id="hire_date"
                                name="hire_date"
                                value={newEmployee.hire_date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="position_id" className="block text-sm font-medium text-black mb-1">
                                Position <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="position_id"
                                name="position_id"
                                value={newEmployee.position_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Position</option>
                                {positions.map(position => (
                                    <option key={position.id} value={position.id}>{position.position_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="department_id" className="block text-sm font-medium text-black mb-1">
                                Department <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="department_id"
                                name="department_id"
                                value={newEmployee.department_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(department => (
                                    <option key={department.id} value={department.id}>{department.department_name}</option>
                                ))}
                            </select>
                        </div>
                        {/* New: Location Field */}
                        <div>
                            <label htmlFor="location_id" className="block text-sm font-medium text-black mb-1">
                                Location <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="location_id"
                                name="location_id"
                                value={newEmployee.location_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Location</option>
                                {locations.map(location => (
                                    <option key={location.id} value={location.id}>{location.location_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="guarantor_name" className="block text-sm font-medium text-black mb-1">
                                Guarantor Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="guarantor_name"
                                name="guarantor_name"
                                value={newEmployee.guarantor_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="guarantor_phone_number" className="block text-sm font-medium text-black mb-1">
                                Guarantor Phone Number <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="tel"
                                id="guarantor_phone_number"
                                name="guarantor_phone_number"
                                value={newEmployee.guarantor_phone_number}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="guarantor_name_2" className="block text-sm font-medium text-black mb-1">
                                Second Guarantor Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="guarantor_name_2"
                                name="guarantor_name_2"
                                value={newEmployee.guarantor_name_2}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="guarantor_phone_number_2" className="block text-sm font-medium text-black mb-1">
                                Second Guarantor Phone <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="tel"
                                id="guarantor_phone_number_2"
                                name="guarantor_phone_number_2"
                                value={newEmployee.guarantor_phone_number_2}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-black mb-4">4. Compensation & Documents</h3>
                        <div>
                            <label htmlFor="salary" className="block text-sm font-medium text-black mb-1">
                                Salary (NGN) <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="number"
                                id="salary"
                                name="salary"
                                value={newEmployee.salary}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="compensation" className="block text-sm font-medium text-black mb-1">
                                Compensation (NGN) <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="number"
                                id="compensation"
                                name="compensation"
                                value={newEmployee.compensation}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="incentive" className="block text-sm font-medium text-black mb-1">
                                Incentive (NGN) <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="number"
                                id="incentive"
                                name="incentive"
                                value={newEmployee.incentive}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="bonus" className="block text-sm font-medium text-black mb-1">
                                Bonus (NGN) <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="number"
                                id="bonus"
                                name="bonus"
                                value={newEmployee.bonus}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                min="0"
                            />
                        </div>
                        <div>
                            <label htmlFor="bank_account_number" className="block text-sm font-medium text-black mb-1">
                                Bank Account Number <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="bank_account_number"
                                name="bank_account_number"
                                value={newEmployee.bank_account_number}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="bank_name" className="block text-sm font-medium text-black mb-1">
                                Bank Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="bank_name"
                                name="bank_name"
                                value={newEmployee.bank_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="account_name" className="block text-sm font-medium text-black mb-1">
                                Account Name <span className="text-[#b88b1b]">*</span>
                            </label>
                            <input
                                type="text"
                                id="account_name"
                                name="account_name"
                                value={newEmployee.account_name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="signature" className="block text-sm font-medium text-black mb-2">
                                Scanned Copy of Signature <span className="text-[#b88b1b]">*</span>
                            </label>
                            <div className="w-full h-32 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center mb-3 overflow-hidden">
                                {signaturePreviewUrl ? (
                                    <img src={signaturePreviewUrl} alt="Signature Preview" className="h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-sm">No Signature Selected</span>
                                )}
                            </div>
                            <input
                                type="file"
                                id="signature"
                                name="signature"
                                accept="image/*"
                                onChange={handleSignatureChange}
                                ref={signatureInputRef}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[#b88b1b] file:text-white
                                    hover:file:bg-[#997417] cursor-pointer"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="documents" className="block text-sm font-medium text-black mb-2">
                                Supporting Documents
                            </label>
                            <input
                                type="file"
                                id="documents"
                                name="documents"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                multiple
                                onChange={handleDocumentChange}
                                ref={documentsInputRef}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[#b88b1b] file:text-white
                                    hover:file:bg-[#997417] cursor-pointer"
                            />
                            <div className="mt-3 space-y-2">
                                {documentPreviews.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                        <span className="text-sm text-black truncate">{doc.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument(index)}
                                            className="ml-4 text-red-600 text-sm hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`fixed inset-0 bg-[#000000aa] bg-opacity-75 overflow-y-auto z-50 flex justify-center items-center ${isOpen ? '' : 'hidden'}`}>
            <div ref={modalContentRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-black">Add New Employee</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
                        <span>Step {currentStep} of {totalSteps}</span>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={`w-6 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                                        currentStep === step ? 'bg-[#b88b1b] w-8' : 'bg-gray-300'
                                    }`}
                                    onClick={() => handleStepClick(step)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-[#b88b1b] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {renderStepContent()}

                    <div className="flex justify-between mt-6 pt-4 border-t">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                            >
                                Previous
                            </button>
                        )}
                        {currentStep < totalSteps && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="ml-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#b88b1b] hover:bg-[#997417] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                            >
                                Next
                            </button>
                        )}
                        {currentStep === totalSteps && (
                            <button
                                type="submit"
                                className="ml-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#b88b1b] hover:bg-[#997417] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                                disabled={loading}
                            >
                                {loading ? 'Adding Employee...' : 'Add Employee'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;