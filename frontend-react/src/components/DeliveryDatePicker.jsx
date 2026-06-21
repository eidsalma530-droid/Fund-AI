import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseValue(value) {
    const today = new Date();
    if (!value) {
        return { year: today.getFullYear(), month: today.getMonth(), day: null };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return { year, month: month - 1, day };
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
        const [year, month] = value.split('-').map(Number);
        return { year, month: month - 1, day: null };
    }
    return { year: today.getFullYear(), month: today.getMonth(), day: null };
}

function formatStoredValue(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    if (day == null) return `${year}-${m}`;
    return `${year}-${m}-${String(day).padStart(2, '0')}`;
}

export function formatDeliveryDisplay(value) {
    if (!value) return '';
    const parsed = parseValue(value);
    if (/^\d{4}-\d{2}$/.test(value)) {
        return new Date(parsed.year, parsed.month, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }
    return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const DeliveryDatePicker = ({ value, onChange, placeholder = 'Select delivery date' }) => {
    const parsed = useMemo(() => parseValue(value), [value]);
    const [open, setOpen] = useState(false);
    const [panel, setPanel] = useState('day');
    const [viewYear, setViewYear] = useState(parsed.year);
    const [viewMonth, setViewMonth] = useState(parsed.month);
    const [pendingDay, setPendingDay] = useState(parsed.day);
    const [yearPageStart, setYearPageStart] = useState(parsed.year - 5);
    const [popoverStyle, setPopoverStyle] = useState({ top: 0, left: 0, width: 320 });

    const triggerRef = useRef(null);
    const popoverRef = useRef(null);

    const updatePopoverPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const width = Math.max(rect.width, 320);
        let left = rect.left;
        const maxLeft = window.innerWidth - width - 16;
        if (left > maxLeft) left = Math.max(16, maxLeft);

        setPopoverStyle({ top: rect.bottom + 8, left, width });
    }, []);

    const syncDraftFromValue = useCallback(() => {
        const next = parseValue(value);
        setViewYear(next.year);
        setViewMonth(next.month);
        setPendingDay(next.day);
        setYearPageStart(next.year - 5);
        setPanel('day');
    }, [value]);

    const openPicker = () => {
        syncDraftFromValue();
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        updatePopoverPosition();
        const handleReposition = () => updatePopoverPosition();
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [open, updatePopoverPosition]);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (triggerRef.current?.contains(e.target) || popoverRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const calendarCells = [];
    for (let i = 0; i < firstWeekday; i++) calendarCells.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push(day);

    const yearOptions = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const handleConfirm = () => {
        onChange(formatStoredValue(viewYear, viewMonth, pendingDay));
        setOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setPendingDay(today.getDate());
        setYearPageStart(today.getFullYear() - 5);
        setPanel('day');
    };

    const handleSelectMonth = (monthIndex) => {
        setViewMonth(monthIndex);
        setPanel('day');
    };

    const handleSelectYear = (year) => {
        setViewYear(year);
        setYearPageStart(year - 5);
        setPanel('month');
    };

    const selectionPreview = pendingDay == null
        ? `${MONTHS[viewMonth]} ${viewYear}`
        : `${MONTHS[viewMonth]} ${pendingDay}, ${viewYear}`;

    const popover = (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    style={{
                        position: 'fixed',
                        top: popoverStyle.top,
                        left: popoverStyle.left,
                        width: popoverStyle.width,
                        zIndex: 9999,
                    }}
                    className="rounded-2xl border border-white/15 bg-[#0f0f23] shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden isolate"
                >
                    <div className="p-4 bg-[#0f0f23]">
                        {panel === 'day' && (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        onClick={goPrevMonth}
                                        className="p-2 rounded-lg bg-[#1a1a35] hover:bg-[#252545] text-white/70 hover:text-white transition-colors"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setPanel('month')}
                                                className="text-sm font-semibold text-white px-2 py-0.5 rounded-lg hover:bg-[#667eea]/20 hover:text-[#a5b4fc] transition-colors"
                                            >
                                                {MONTHS[viewMonth]}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setYearPageStart(viewYear - 5);
                                                    setPanel('year');
                                                }}
                                                className="text-sm font-semibold text-white px-2 py-0.5 rounded-lg hover:bg-[#667eea]/20 hover:text-[#a5b4fc] transition-colors"
                                            >
                                                {viewYear}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={goNextMonth}
                                        className="p-2 rounded-lg bg-[#1a1a35] hover:bg-[#252545] text-white/70 hover:text-white transition-colors"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>

                                <div className="mb-2 px-2 py-1.5 rounded-lg bg-[#1a1a35] border border-white/5 text-center">
                                    <span className="text-[11px] text-white/45">Selected: </span>
                                    <span className="text-xs font-medium text-[#a5b4fc]">{selectionPreview}</span>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {WEEKDAYS.map((day) => (
                                        <div key={day} className="text-center text-[11px] font-medium text-white/35 py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map((day, index) => (
                                        <div key={index} className="aspect-square">
                                            {day ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDay(pendingDay === day ? null : day)}
                                                    className={`w-full h-full rounded-xl text-sm font-medium transition-all ${
                                                        pendingDay === day
                                                            ? 'bg-gradient-to-br from-[#667eea] to-[#f093fb] text-white shadow-[0_0_12px_rgba(102,126,234,0.45)]'
                                                            : 'text-white/75 hover:bg-[#1a1a35] hover:text-white'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {panel === 'month' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setPanel('day')}
                                        className="p-2 rounded-lg bg-[#1a1a35] hover:bg-[#252545] text-white/70 hover:text-white transition-colors"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-white">Select month</p>
                                        <p className="text-[11px] text-white/40 mt-0.5">{viewYear}</p>
                                    </div>
                                    <div className="w-9" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {MONTHS.map((month, index) => (
                                        <button
                                            key={month}
                                            type="button"
                                            onClick={() => handleSelectMonth(index)}
                                            className={`py-2.5 px-2 rounded-xl text-sm transition-all ${
                                                viewMonth === index
                                                    ? 'bg-gradient-to-r from-[#667eea] to-[#f093fb] text-white font-semibold shadow-[0_0_14px_rgba(102,126,234,0.35)]'
                                                    : 'bg-[#1a1a35] text-white/75 hover:bg-[#252545] hover:text-white'
                                            }`}
                                        >
                                            {month.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {panel === 'year' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setYearPageStart((s) => s - 12)}
                                        className="p-2 rounded-lg bg-[#1a1a35] hover:bg-[#252545] text-white/70 hover:text-white transition-colors"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-white">Select year</p>
                                        <p className="text-[11px] text-white/40 mt-0.5">
                                            {yearOptions[0]} – {yearOptions[yearOptions.length - 1]}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setYearPageStart((s) => s + 12)}
                                        className="p-2 rounded-lg bg-[#1a1a35] hover:bg-[#252545] text-white/70 hover:text-white transition-colors"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {yearOptions.map((year) => (
                                        <button
                                            key={year}
                                            type="button"
                                            onClick={() => handleSelectYear(year)}
                                            className={`py-2.5 px-2 rounded-xl text-sm transition-all ${
                                                viewYear === year
                                                    ? 'bg-gradient-to-r from-[#667eea] to-[#f093fb] text-white font-semibold shadow-[0_0_14px_rgba(102,126,234,0.35)]'
                                                    : 'bg-[#1a1a35] text-white/75 hover:bg-[#252545] hover:text-white'
                                            }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-xs text-white/45 hover:text-white/70 transition-colors px-2 py-1"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={handleToday}
                                className="text-xs font-medium text-primary hover:text-[#f093fb] transition-colors px-2 py-1"
                            >
                                Today
                            </button>
                            <motion.button
                                type="button"
                                onClick={handleConfirm}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#5a67d8] shadow-[0_0_14px_rgba(102,126,234,0.35)] hover:shadow-[0_0_20px_rgba(102,126,234,0.5)] transition-shadow"
                            >
                                Confirm
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (open ? setOpen(false) : openPicker())}
                className="w-full flex items-center justify-between gap-3 text-left cursor-pointer rounded-xl bg-[rgba(26,26,46,0.8)] border border-white/10 px-4 py-3 text-white transition-all hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
                <span className={value ? 'text-white' : 'text-white/40'}>
                    {value ? formatDeliveryDisplay(value) : placeholder}
                </span>
                <motion.span
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea]/30 to-[#f093fb]/30 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(102,126,234,0.25)]"
                    whileHover={{
                        scale: 1.1,
                        boxShadow: '0 0 20px rgba(102, 126, 234, 0.55), 0 0 28px rgba(240, 147, 251, 0.25)',
                        borderColor: 'rgba(102, 126, 234, 0.6)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                >
                    <FiCalendar className="text-[#a5b4fc]" size={16} />
                </motion.span>
            </button>

            {typeof document !== 'undefined' && createPortal(popover, document.body)}
        </div>
    );
};

export default DeliveryDatePicker;
