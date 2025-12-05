
'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Separator } from './ui/separator';
import { useTheme } from 'next-themes';

// Function to convert HSL string to Hex color
function hslToHex(hslStr: string): string {
    if (!hslStr) return '#000000';
    const [h, s, l] = hslStr.split(' ').map(val => parseFloat(val.replace('%', '')));
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lDecimal - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
        [r, g, b] = [x, 0, c];
    } else if (h >= 300 && h < 360) {
        [r, g, b] = [c, 0, x];
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Function to convert Hex color to HSL string
function hexToHsl(hex: string): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const hue = Math.round(h * 360);
    const saturation = Math.round(s * 100);
    const lightness = Math.round(l * 100);

    return `${hue} ${saturation}% ${lightness}%`;
}


export function ThemeCustomizer() {
    const { theme } = useTheme();
    // Default HSL values from globals.css
    const defaultPrimaryHsl = '221 83% 53%';
    const defaultLightBackgroundHsl = '0 0% 100%'; // Pure White for light mode
    const defaultDarkBackgroundHsl = '222 47% 9%'; // Original dark background
    
    const [primaryHsl, setPrimaryHsl] = useLocalStorage('theme-primary-hsl', defaultPrimaryHsl);
    const [lightBackgroundHsl, setLightBackgroundHsl] = useLocalStorage('theme-light-background-hsl', defaultLightBackgroundHsl);
    const [darkBackgroundHsl, setDarkBackgroundHsl] = useLocalStorage('theme-dark-background-hsl', defaultDarkBackgroundHsl);

    const [primaryColor, setPrimaryColor] = useState(() => hslToHex(primaryHsl));
    const [backgroundColor, setBackgroundColor] = useState(() => hslToHex(theme === 'dark' ? darkBackgroundHsl : lightBackgroundHsl));
    
    // Update UI and CSS variable for primary color
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', primaryHsl);
    }, [primaryHsl]);
    
    // Update UI and CSS variable for background color
    useEffect(() => {
        const currentBgHsl = theme === 'dark' ? darkBackgroundHsl : lightBackgroundHsl;
        document.documentElement.style.setProperty('--background', currentBgHsl);
        setBackgroundColor(hslToHex(currentBgHsl));
    }, [theme, lightBackgroundHsl, darkBackgroundHsl]);


    const handlePrimaryColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setPrimaryColor(newHex);
        const newHsl = hexToHsl(newHex);
        setPrimaryHsl(newHsl);
    };

    const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setBackgroundColor(newHex);
        const newHsl = hexToHsl(newHex);
        if (theme === 'dark') {
            setDarkBackgroundHsl(newHsl);
        } else {
            setLightBackgroundHsl(newHsl);
        }
    };

    const handleReset = () => {
        setPrimaryHsl(defaultPrimaryHsl);
        setLightBackgroundHsl(defaultLightBackgroundHsl);
        setDarkBackgroundHsl(defaultDarkBackgroundHsl);
        
        setPrimaryColor(hslToHex(defaultPrimaryHsl));
        // Set the hex color based on the current theme after resetting
        if (theme === 'dark') {
             setBackgroundColor(hslToHex(defaultDarkBackgroundHsl));
        } else {
             setBackgroundColor(hslToHex(defaultLightBackgroundHsl));
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-4">
                <div className="grid gap-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="primary-color" className="font-semibold">Primary Color</Label>
                        <div className="flex items-center gap-2">
                            <input
                                id="primary-color"
                                type="color"
                                value={primaryColor}
                                onChange={handlePrimaryColorChange}
                                className="h-8 w-8 rounded-md border-none cursor-pointer p-0"
                            />
                            <span className="text-sm text-muted-foreground font-mono">{primaryColor.toUpperCase()}</span>
                        </div>
                    </div>
                    
                     <div className="space-y-2">
                        <Label htmlFor="background-color" className="font-semibold">Background Color</Label>
                        <div className="flex items-center gap-2">
                            <input
                                id="background-color"
                                type="color"
                                value={backgroundColor}
                                onChange={handleBackgroundColorChange}
                                className="h-8 w-8 rounded-md border-none cursor-pointer p-0"
                            />
                            <span className="text-sm text-muted-foreground font-mono">{backgroundColor.toUpperCase()}</span>
                        </div>
                    </div>
                    <Separator />
                    <Button onClick={handleReset} variant="ghost" className="w-full justify-center text-sm">
                        <Undo2 className="h-4 w-4 mr-2" />
                        Reset to Default
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
