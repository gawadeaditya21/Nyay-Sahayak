import crypto from 'crypto';
import { maskSensitiveData } from './dataMasking.js';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY); 
const IV_LENGTH = 16;

export const processAndEncrypt = (rawText) => {
    // 1. Pehle Masking karein (Privacy)
    const maskingResult = maskSensitiveData(rawText);
    const maskedText = maskingResult.maskedText;

    // 2. Ab Encrypt karein (Security)
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(maskedText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // IV aur Encrypted text ko combine karke bhej rahe hain storage ke liye
    return {
        secureString: iv.toString('hex') + ':' + encrypted,
        maskingSummary: maskingResult.summary
    };
};

export const encryptData = (rawText) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(rawText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
};

export const decryptData = (encryptedText) => {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};