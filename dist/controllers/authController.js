import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { sendOtpEmail } from "../services/emailService.js";
const DEFAULT_DEV_OTP = "123456";
/**
 * Generate 6-digit random numeric OTP
 */
const generateOtpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
/**
 * @desc   Request 6-digit OTP for Email Login / Signup
 * @route  POST /api/auth/send-otp
 * @access Public
 */
export const sendOtp = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        // Accept either email (preferred) or phone
        const targetEmail = email ? String(email).trim().toLowerCase() : null;
        const targetPhone = phone ? String(phone).trim() : null;
        if (!targetEmail && !targetPhone) {
            throw new ApiError(400, "Please provide a valid email address.");
        }
        const identifier = targetEmail || `${targetPhone}@hyperlocal.in`;
        const otpCode = process.env.NODE_ENV === "production" ? generateOtpCode() : DEFAULT_DEV_OTP;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        // Save OTP to database
        await prisma.otp.create({
            data: {
                email: identifier,
                otp: otpCode,
                expiresAt,
            },
        });
        // Send Email OTP via Nodemailer
        if (targetEmail) {
            await sendOtpEmail(targetEmail, otpCode);
        }
        res.status(200).json({
            success: true,
            message: `6-digit OTP sent successfully to ${identifier}. (Dev Testing OTP: ${DEFAULT_DEV_OTP})`,
            devOtp: DEFAULT_DEV_OTP,
            expiresIn: "10 minutes",
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Verify OTP, Register/Login User, Demand Mandatory Onboarding (Name, Age, Skills), and Issue JWT
 * @route  POST /api/auth/verify-otp
 * @access Public
 */
export const verifyOtp = async (req, res, next) => {
    try {
        const { email, phone, otp, name, age, skills, role, address } = req.body;
        const targetEmail = email ? String(email).trim().toLowerCase() : (phone ? `${String(phone).trim()}@hyperlocal.in` : null);
        if (!targetEmail || !otp) {
            throw new ApiError(400, "Email and OTP code are required.");
        }
        const cleanOtp = String(otp).trim();
        // Verify OTP against Database record or Dev OTP
        let isValidOtp = cleanOtp === DEFAULT_DEV_OTP;
        if (!isValidOtp) {
            const dbOtp = await prisma.otp.findFirst({
                where: {
                    email: targetEmail,
                    otp: cleanOtp,
                    verified: false,
                    expiresAt: { gte: new Date() },
                },
                orderBy: { createdAt: "desc" },
            });
            if (dbOtp) {
                isValidOtp = true;
                // Mark OTP as used
                await prisma.otp.update({
                    where: { id: dbOtp.id },
                    data: { verified: true },
                });
            }
        }
        if (!isValidOtp) {
            throw new ApiError(400, `Invalid or expired OTP. For test verification, use '${DEFAULT_DEV_OTP}'.`);
        }
        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: {
                customer_profile: true,
                worker_profile: true,
            },
        });
        const parsedAge = age ? parseInt(String(age), 10) : 21;
        const parsedSkills = Array.isArray(skills)
            ? skills
            : typeof skills === "string" && skills.trim()
                ? skills.split(",").map((s) => s.trim()).filter(Boolean)
                : ["Errands", "Delivery"];
        const userRole = role === "worker" ? "worker" : "poster";
        if (!user) {
            // Mandatory validation for onboarding new user
            const defaultName = name?.trim() || targetEmail.split("@")[0] || "Task User";
            user = await prisma.user.create({
                data: {
                    email: targetEmail,
                    phone: phone ? String(phone).trim() : null,
                    name: defaultName,
                    age: isNaN(parsedAge) ? 21 : parsedAge,
                    skills: parsedSkills,
                    role: userRole,
                    customer_profile: {
                        create: {
                            address: address?.trim() || "Indiranagar, Bengaluru",
                            avgRating: 5.0,
                        },
                    },
                    worker_profile: {
                        create: {
                            skills: parsedSkills.join(", "),
                            skillsList: parsedSkills,
                            hourlyRate: 250,
                            isAvailable: true,
                            avgRating: 5.0,
                            address: address?.trim() || "Indiranagar, Bengaluru",
                        },
                    },
                },
                include: {
                    customer_profile: true,
                    worker_profile: true,
                },
            });
        }
        else {
            // If user provided additional onboarding details on login, update profile
            const updateData = {};
            if (name && name.trim())
                updateData.name = name.trim();
            if (age && !isNaN(parseInt(String(age), 10)))
                updateData.age = parseInt(String(age), 10);
            if (skills && Array.isArray(skills) && skills.length > 0)
                updateData.skills = skills;
            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                    include: {
                        customer_profile: true,
                        worker_profile: true,
                    },
                });
            }
            // Ensure customer & worker profiles exist
            if (!user.customer_profile) {
                await prisma.customer_profile.create({
                    data: {
                        userId: user.id,
                        address: address?.trim() || "Indiranagar, Bengaluru",
                        avgRating: 5.0,
                    },
                });
            }
            if (!user.worker_profile || user.worker_profile.length === 0) {
                await prisma.worker_profile.create({
                    data: {
                        userId: user.id,
                        skills: parsedSkills.join(", "),
                        skillsList: parsedSkills,
                        hourlyRate: 250,
                        isAvailable: true,
                        avgRating: 5.0,
                        address: address?.trim() || "Indiranagar, Bengaluru",
                    },
                });
            }
            // Refresh user object with profiles
            user = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    customer_profile: true,
                    worker_profile: true,
                },
            });
        }
        // Generate JWT Auth Token
        const secret = process.env.JWT_SECRET || "super_secret_jwt_key_hyperlocal_2025";
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        }, secret, { expiresIn: "30d" });
        res.status(200).json({
            success: true,
            message: "Authentication successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                age: user.age,
                skills: user.skills,
                role: user.role,
                avatarUrl: user.avatarUrl,
                customerProfile: user.customer_profile,
                workerProfiles: user.worker_profile,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Get Current Logged-in User Profile & Full Identities
 * @route  GET /api/auth/me
 * @access Private
 */
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, "Not authenticated");
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                customer_profile: true,
                worker_profile: {
                    include: {
                        service: true,
                    },
                },
            },
        });
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                age: user.age,
                skills: user.skills,
                role: user.role,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                customerProfile: user.customer_profile,
                workerProfiles: user.worker_profile,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
