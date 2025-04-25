/**
 * Utilities for parsing and handling ICS calendar files
 */

/**
 * Parse an ICS file string content and return the events
 * @param {string} icsContent - The content of the ICS file as a string
 * @returns {Array} - Array of parsed events
 */
export const parseICS = (icsContent) => {
  // Check if the content is valid ICS
  if (
    !icsContent.includes("BEGIN:VCALENDAR") ||
    !icsContent.includes("END:VCALENDAR")
  ) {
    throw new Error("Invalid ICS file format");
  }

  const events = [];

  try {
    // Split into events
    const eventBlocks = icsContent.split("BEGIN:VEVENT");

    // Skip the first part (calendar header)
    for (let i = 1; i < eventBlocks.length; i++) {
      const eventBlock = eventBlocks[i];
      const endIndex = eventBlock.indexOf("END:VEVENT");

      if (endIndex === -1) continue;

      const eventData = eventBlock.substring(0, endIndex).trim();

      // Split into lines and create object of properties
      const eventLines = eventData.split("\n");
      const eventProps = {};

      for (let line of eventLines) {
        line = line.trim();
        if (!line) continue;

        // Check for property with parameters
        if (line.includes(";") && line.includes(":")) {
          const colonPos = line.indexOf(":");
          const key = line.substring(0, colonPos).split(";")[0]; // Get the base property name
          const value = line.substring(colonPos + 1);
          eventProps[key] = value;

          // Store the fact that this is a date-only value if VALUE=DATE is present
          if (line.includes("VALUE=DATE")) {
            eventProps[key + "_TYPE"] = "DATE";
          }
        } else if (line.includes(":")) {
          const parts = line.split(":");
          eventProps[parts[0]] = parts.slice(1).join(":");
        }
      }

      // Check for required properties
      if (!eventProps.SUMMARY || !eventProps.DTSTART) continue;

      // Parse dates
      let startDate;
      if (eventProps.DTSTART_TYPE === "DATE") {
        // Handle date-only format (typically for all-day events like birthdays)
        const dateStr = eventProps.DTSTART;
        startDate = parseDateOnly(dateStr);
      } else {
        // Handle normal datetime format
        startDate = parseDateTime(eventProps.DTSTART);
      }

      if (!startDate) continue;

      // For birthdays, use a fixed duration of 24 hours
      const isBirthday =
        eventProps.SUMMARY.toLowerCase().includes("birthday") ||
        (eventProps.CATEGORIES &&
          eventProps.CATEGORIES.toLowerCase().includes("birthday"));

      const duration = isBirthday ? 1440 : 60; // 24h for birthdays, 1h default for other events

      // Create event object
      const event = {
        title: eventProps.SUMMARY,
        description: eventProps.DESCRIPTION || "",
        date: formatDateForAPI(startDate),
        time: formatTimeForDisplay(startDate),
        duration: duration,
        priority: "medium",
        category: isBirthday ? "Birthday" : "imported",
      };

      events.push(event);
    }
  } catch (error) {
    console.error("Error parsing ICS file:", error);
    // Return any events we successfully parsed instead of throwing
    if (events.length === 0) {
      throw error;
    }
  }

  return events;
};

/**
 * Parse a date-only string (YYYYMMDD) into a Date object
 * @param {string} dateStr - The date string (e.g., "20230601")
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
function parseDateOnly(dateStr) {
  try {
    if (dateStr.length !== 8) return null;

    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(6, 8));

    return new Date(year, month, day, 0, 0, 0);
  } catch (e) {
    console.error("Error parsing date:", e);
    return null;
  }
}

/**
 * Parse a datetime string into a Date object
 * @param {string} dateTimeStr - The datetime string (e.g., "20230601T120000Z")
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
function parseDateTime(dateTimeStr) {
  try {
    if (dateTimeStr.length < 8) return null;

    // Handle date-only case first (fallback)
    if (dateTimeStr.length === 8) {
      return parseDateOnly(dateTimeStr);
    }

    // Handle datetime cases
    const hasT = dateTimeStr.includes("T");
    const hasZ = dateTimeStr.includes("Z");

    if (hasT) {
      const year = parseInt(dateTimeStr.substring(0, 4));
      const month = parseInt(dateTimeStr.substring(4, 6)) - 1;
      const day = parseInt(dateTimeStr.substring(6, 8));

      const timeStart = dateTimeStr.indexOf("T") + 1;
      const hour = parseInt(dateTimeStr.substring(timeStart, timeStart + 2));
      const minute = parseInt(
        dateTimeStr.substring(timeStart + 2, timeStart + 4)
      );
      const second = parseInt(
        dateTimeStr.substring(timeStart + 4, timeStart + 6) || "0"
      );

      if (hasZ) {
        // UTC time
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      } else {
        // Local time
        return new Date(year, month, day, hour, minute, second);
      }
    }

    // Fallback to date-only for any other format
    return parseDateOnly(dateTimeStr.substring(0, 8));
  } catch (e) {
    console.error("Error parsing datetime:", e);
    return null;
  }
}

/**
 * Format a Date object to API format (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDateForAPI(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Format a Date object to display time format (HH:MM AM/PM)
 * @param {Date} date - Date object
 * @returns {string} - Formatted time string
 */
function formatTimeForDisplay(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const amPm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

  return `${hours}:${minutes} ${amPm}`;
}

/**
 * Save events from an ICS file to the database
 * @param {Array} events - Array of parsed events
 * @param {number} userId - User ID
 * @returns {Promise} - Promise that resolves with the result of the API call
 */
export const saveICSEvents = async (events, userId) => {
  try {
    const response = await fetch(
      `${window.location.origin}/api/ics-import.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          events,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Error saving ICS events:", error);
    throw error;
  }
};
