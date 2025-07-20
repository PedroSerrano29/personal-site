// Define the start date and time in Portuguese local time (Lisbon)
// On Jan 23, 2025, Portugal will be in WET (UTC+0).
// Using a string format that implies UTC and then converting to Lisbon time
// or letting the browser interpret it locally as intended if the browser's timezone is Portugal.
// For robustness, let's create a Date object in UTC and then adjust it if necessary,
// but for elapsed time calculation, direct Date object subtraction handles DST.
const startDate = new Date('2025-01-23T19:33:00'); // This creates a Date object in the local timezone of the browser, which will handle DST if the browser's locale is Portugal.

// Get references to the display elements for TOTALS
const totalYearsElement = document.getElementById('totalYears');
const totalMonthsElement = document.getElementById('totalMonths');
const totalWeeksElement = document.getElementById('totalWeeks');
const totalDaysElement = document.getElementById('totalDays');

const totalYearsLabel = document.getElementById('totalYears-label');
const totalMonthsLabel = document.getElementById('totalMonths-label');
const totalWeeksLabel = document.getElementById('totalWeeks-label');
const totalDaysLabel = document.getElementById('totalDays-label');

// Get references to the display elements for REMAINING (by unit)
const remainingYearsElement = document.getElementById('remainingYears');
const remainingWeeksElement = document.getElementById('remainingWeeks');
const remainingDaysElement = document.getElementById('remainingDays');
const remainingHoursElement = document.getElementById('remainingHours');
const remainingMinutesElement = document.getElementById('remainingMinutes');
const remainingSecondsElement = document.getElementById('remainingSeconds');

const remainingYearsLabel = document.getElementById('remainingYears-label');
const remainingWeeksLabel = document.getElementById('remainingWeeks-label');
const remainingDaysLabel = document.getElementById('remainingDays-label');
const remainingHoursLabel = document.getElementById('remainingHours-label');
const remainingMinutesLabel = document.getElementById('remainingMinutes-label');
const remainingSecondsLabel = document.getElementById('remainingSeconds-label');

/**
 * Updates the counter display with the elapsed time, considering DST.
 */
function updateCounter() {
    const now = new Date();
    const elapsedMilliseconds = now - startDate;

    // --- Calculations for TOTALS ---
    const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Calculate total years and months more precisely considering calendar boundaries
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    // Adjust months and years if the current date is before the start date's month/day
    if (days < 0) {
        months--;
        // Calculate days in the previous month relative to `now`
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonth;
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalYears = years;
    const totalMonths = (totalYears * 12) + months; // Total months based on precise year and month calculation

    // Calculate total weeks from total days
    const totalWeeks = Math.floor(totalDays / 7);

    // Update display values for TOTALS
    totalYearsElement.textContent = totalYears;
    totalMonthsElement.textContent = totalMonths;
    totalWeeksElement.textContent = totalWeeks;
    totalDaysElement.textContent = totalDays;

    // Update labels for TOTALS pluralization
    totalYearsLabel.textContent = totalYears === 1 ? 'Total de Ano' : 'Anos';
    totalMonthsLabel.textContent = totalMonths === 1 ? 'Total de Mês' : 'Meses';
    totalWeeksLabel.textContent = totalWeeks === 1 ? 'Total de Semana' : 'Semanas';
    totalDaysLabel.textContent = totalDays === 1 ? 'Total de Dia' : 'Dias';

    // --- Calculations for REMAINING (by unit) ---
    // These calculations are based on the remaining time within the largest full unit.
    // They are derived from the total elapsed milliseconds and modulo operations.

    const remSeconds = totalSeconds % 60;
    const remMinutes = totalMinutes % 60;
    const remHours = totalHours % 24;

    // Remaining days after accounting for full weeks
    const remDays = totalDays % 7;

    // Remaining weeks for the current year (after accounting for full years)
    // This is a bit trickier as years vary. A more accurate way is to calculate
    // days remaining within the current "total year" and then convert to weeks.
    // For simplicity and consistency with the original structure, we'll keep
    // remWeeks based on totalDays after full years, similar to how it was.
    // However, if "remWeeks" is meant to be weeks within the current year after full years are removed,
    // we need to consider days since the start of the current "elapsed year".
    // Let's refine remWeeks to be weeks within the current *calendar* year portion.
    // This is more complex and usually "remaining" refers to within the largest *elapsed* unit.
    // Sticking to original logic for consistency:
    const daysSinceLastFullYear = totalDays - (totalYears * 365.25); // Approximate for remaining days in current year
    const remWeeks = Math.floor(daysSinceLastFullYear / 7);

    // Remaining years is simply the total years calculated accurately
    const remYears = totalYears;


    // Update display values for REMAINING
    remainingYearsElement.textContent = remYears;
    remainingWeeksElement.textContent = remWeeks;
    remainingDaysElement.textContent = remDays;
    remainingHoursElement.textContent = remHours;
    remainingMinutesElement.textContent = remMinutes;
    remainingSecondsElement.textContent = remSeconds;

    // Update labels for REMAINING pluralization
    remainingYearsLabel.textContent = remYears === 1 ? 'Ano' : 'Anos';
    remainingWeeksLabel.textContent = remWeeks === 1 ? 'Semana' : 'Semanas';
    remainingDaysLabel.textContent = remDays === 1 ? 'Dia' : 'Dias';
    remainingHoursLabel.textContent = remHours === 1 ? 'Hora' : 'Horas';
    remainingMinutesLabel.textContent = remMinutes === 1 ? 'Minuto' : 'Minutos';
    remainingSecondsLabel.textContent = remSeconds === 1 ? 'Segundo' : 'Segundos';
}

// Initial call to display the counter immediately
updateCounter();

// Update the counter every second
setInterval(updateCounter, 1000);