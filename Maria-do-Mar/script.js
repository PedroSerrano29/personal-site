// Define the start date and time in Portuguese local time (Lisbon)
// On Jan 23, 2025, Portugal will be in WET (UTC+0).
const startDate = new Date('2025-01-23T19:47:00'); // This creates a Date object in the local timezone of the browser

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
 * Updates the counter display with the elapsed time.
 */
function updateCounter() {
    const now = new Date();
    const elapsedMilliseconds = now - startDate;

    // --- Calculations for TOTALS ---
    const totalSeconds = Math.floor(elapsedMilliseconds / 1000); // Still needed for other calculations
    const totalMinutes = Math.floor(totalSeconds / 60); // Still needed for other calculations
    const totalHours = Math.floor(totalMinutes / 60); // Still needed for other calculations
    const totalDays = Math.floor(totalHours / 24);
    const totalWeeks = Math.floor(totalDays / 7); // Calculate total weeks

    // Calculate total years (approximate, as years have different days)
    const totalYears = Math.floor(totalDays / 365.25);

    // Calculate total months more precisely
    let totalMonths = (now.getFullYear() - startDate.getFullYear()) * 12;
    totalMonths -= startDate.getMonth();
    totalMonths += now.getMonth();
    // If the current day of the month is before the start day, a full month hasn't passed yet
    if (now.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    // Ensure months doesn't go negative if startDate is in the future (shouldn't happen for elapsed time)
    totalMonths = Math.max(0, totalMonths);


    // Update display values for TOTALS
    totalYearsElement.textContent = totalYears;
    totalMonthsElement.textContent = totalMonths;
    totalWeeksElement.textContent = totalWeeks;
    totalDaysElement.textContent = totalDays;

    // Update labels for TOTALS pluralization
    totalYearsLabel.textContent = totalYears === 1 ? 'Total de Ano' : 'Total de Anos';
    totalMonthsLabel.textContent = totalMonths === 1 ? 'Total de Mês' : 'Total de Meses';
    totalWeeksLabel.textContent = totalWeeks === 1 ? 'Total de Semana' : 'Total de Semanas';
    totalDaysLabel.textContent = totalDays === 1 ? 'Total de Dia' : 'Total de Dias';


    // --- Calculations for REMAINING (by unit) ---
    const remSeconds = totalSeconds % 60;
    const remMinutes = totalMinutes % 60;
    const remHours = totalHours % 24;
    const remDays = totalDays % 7; // Days remaining after accounting for full weeks
    // For remaining weeks, it's weeks within the current year after full years are accounted for
    const remWeeks = Math.floor((totalDays % 365.25) / 7); // Weeks remaining after accounting for full years
    // For remaining years, it's simply the total years, as it's the largest unit
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
