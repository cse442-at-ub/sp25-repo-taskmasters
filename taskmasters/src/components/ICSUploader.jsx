import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import config from "../config";

// Debug/logging function
const debug = (message, data) => {
  console.log(`[ICS UPLOADER] ${message}`, data);
};

const ICSUploader = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an ICS file
    if (!file.name.toLowerCase().endsWith(".ics")) {
      setUploadStatus("error");
      setStatusMessage(
        "Invalid ICS file. Please upload a valid .ics calendar file."
      );
      return;
    }

    setIsUploading(true);
    setUploadStatus("loading");
    setStatusMessage(`Processing ${file.name}...`);

    try {
      // Read the file content
      const fileContent = await readFileAsText(file);
      debug("File content sample:", fileContent.substring(0, 200) + "...");

      // Process the ICS file
      const events = processICSFile(fileContent);
      debug("Parsed events count:", events.length);

      if (events.length === 0) {
        setUploadStatus("error");
        setStatusMessage(
          `No events found in ${file.name}. Please check the file format.`
        );
        setIsUploading(false);
        return;
      }

      // Count events by type
      const birthdayEvents = events.filter(
        (e) =>
          e.title.toLowerCase().includes("birthday") ||
          e.category.toLowerCase().includes("birthday")
      );

      const regularEvents = events.filter(
        (e) =>
          !e.title.toLowerCase().includes("birthday") &&
          !e.category.toLowerCase().includes("birthday")
      );

      debug("Birthday events:", birthdayEvents.length);
      debug("Regular events:", regularEvents.length);

      // Create summary message
      let summaryMessage = `Found ${events.length} events`;
      if (birthdayEvents.length > 0 && regularEvents.length > 0) {
        summaryMessage += ` (${birthdayEvents.length} birthdays, ${regularEvents.length} regular events)`;
      } else if (birthdayEvents.length > 0) {
        summaryMessage += ` (all birthdays)`;
      }
      summaryMessage += `. Importing...`;

      setStatusMessage(summaryMessage);

      // Create tasks directly using the tasks API endpoint
      const result = await createTasksFromEvents(events);

      debug("Import result:", result);

      if (result.success) {
        let resultMessage = `Successfully imported ${result.added} events!`;

        // Add info about skipped duplicates if any
        if (result.skipped > 0) {
          resultMessage += ` (${result.skipped} duplicate ${
            result.skipped === 1 ? "event was" : "events were"
          } skipped)`;
        }

        setUploadStatus("success");
        setStatusMessage(resultMessage);

        // Notify parent component that upload is complete
        if (onUploadComplete) {
          onUploadComplete({
            status: "success",
            added: result.added,
            skipped: result.skipped,
          });
        }
      } else {
        setUploadStatus("error");
        setStatusMessage(`Error importing events: ${result.message}`);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadStatus("error");
      setStatusMessage(
        `Error: ${error.message || "Could not process the file"}`
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = null;
    }
  };

  // Create tasks directly using the tasks API endpoint
  const createTasksFromEvents = async (events) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      debug("User ID:", user.id);
      console.log("=====================================================");
      console.log("STARTING ICS IMPORT - TOTAL EVENTS:", events.length);
      console.log("=====================================================");

      let added = 0;
      let skipped = 0;
      let errors = 0;

      // Group events by date for efficient duplicate checking
      const eventsByDate = {};
      events.forEach((event) => {
        if (!eventsByDate[event.date]) {
          eventsByDate[event.date] = [];
        }
        eventsByDate[event.date].push(event);
      });

      // Process each date and check for duplicates
      for (const date in eventsByDate) {
        const eventsForDate = eventsByDate[date];
        console.log(
          `Processing ${eventsForDate.length} events for date ${date}`
        );

        // Fetch existing tasks for this date
        try {
          const tasksResponse = await fetch(
            `${config.apiUrl}/tasks.php?date=${date}&userId=${user.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          let existingTasks = [];
          if (tasksResponse.ok) {
            existingTasks = await tasksResponse.json();
            console.log(
              `Found ${existingTasks.length} existing tasks on ${date}`
            );
          }

          // Process each event for this date
          for (const event of eventsForDate) {
            try {
              debug("Processing event:", event.title);
              console.log(
                `Processing event: "${event.title}" (${event.date} @ ${event.time})`
              );

              // Check if this event already exists on this date
              const isDuplicate = existingTasks.some((task) => {
                // Compare title (case insensitive)
                const titleMatch =
                  task.task_Title &&
                  task.task_Title.toLowerCase() === event.title.toLowerCase();

                // For time, we just check if they start at the same hour
                const timeHour = event.time.split(":")[0];
                const taskTimeContainsHour =
                  task.Task_time && task.Task_time.includes(timeHour + ":");

                return titleMatch && taskTimeContainsHour;
              });

              if (isDuplicate) {
                console.log(
                  `Skipping duplicate event: "${event.title}" on ${event.date}`
                );
                skipped++;
                continue;
              }

              // Match the exact format the backend expects
              const taskData = {
                userId: user.id,
                taskName: event.title || "Untitled Event",
                description: event.description || "",
                startDate: event.date,
                endDate: event.date,
                startTime: event.time,
                priority: event.priority || "medium",
                category: event.category || "Import",
                duration: event.duration || 60,
                recurring: event.recurring || 0,
                recurringDays: event.recurringDays || "",
              };

              debug("Sending task data:", taskData);
              console.log("Sending to API:", JSON.stringify(taskData, null, 2));

              // Send POST request directly to tasks.php
              const response = await fetch(`${config.apiUrl}/tasks.php`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(taskData),
              });

              if (!response.ok) {
                const text = await response.text();
                console.error("API error response:", text);
                throw new Error(
                  `API request failed: ${response.status} ${text}`
                );
              }

              const responseData = await response.json();
              debug("API response:", responseData);
              console.log("API response:", responseData);

              if (
                responseData.message &&
                responseData.message.includes("created successfully")
              ) {
                added++;
                console.log(
                  `✅ Task "${event.title}" created successfully (ID: ${
                    responseData.id || "unknown"
                  })`
                );

                // Add this task to our list of existing tasks to prevent duplicates
                // in the current batch of imports
                existingTasks.push({
                  task_Title: event.title,
                  Task_time: event.date + " " + event.time,
                });
              } else {
                errors++;
                console.error(
                  `❌ Error creating task "${event.title}":`,
                  responseData
                );
              }
            } catch (taskError) {
              console.error(
                `❌ Exception creating task "${event.title || "unknown"}":`,
                taskError
              );
              errors++;
            }
          }
        } catch (dateError) {
          console.error(`Error processing date ${date}:`, dateError);
          errors++;
        }
      }

      console.log("=====================================================");
      console.log(
        `ICS IMPORT COMPLETE: ${added} added, ${skipped} skipped, ${errors} errors`
      );
      console.log("=====================================================");

      return {
        success: true,
        added,
        skipped,
        errors,
      };
    } catch (error) {
      console.error("Task creation error:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  };

  // Process ICS file content and extract events
  const processICSFile = (content) => {
    try {
      if (
        !content.includes("BEGIN:VCALENDAR") ||
        !content.includes("END:VCALENDAR")
      ) {
        throw new Error("Invalid ICS file format");
      }

      const events = [];
      const eventBlocks = content.split("BEGIN:VEVENT");

      // Skip the first part (calendar header)
      for (let i = 1; i < eventBlocks.length; i++) {
        const block = eventBlocks[i];
        const endIndex = block.indexOf("END:VEVENT");

        if (endIndex === -1) continue;

        const eventText = block.substring(0, endIndex).trim();
        const lines = eventText.split("\n");
        const eventProps = {};

        // Extract properties from lines
        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          // Handle line continuations (folded lines)
          if (line.startsWith(" ") || line.startsWith("\t")) {
            const lastKey = Object.keys(eventProps).pop();
            if (lastKey) {
              eventProps[lastKey] += line.trim();
              continue;
            }
          }

          // Handle properties with parameters
          if (line.includes(";") && line.includes(":")) {
            const colonPos = line.indexOf(":");
            const fullKey = line.substring(0, colonPos);
            const baseKey = fullKey.split(";")[0]; // Get base property
            const value = line.substring(colonPos + 1);

            // Store the full property with parameters
            eventProps[baseKey + "_FULL"] = fullKey;
            eventProps[baseKey] = value;

            // Store parameters separately
            if (fullKey.includes(";")) {
              const params = fullKey.split(";").slice(1);
              for (const param of params) {
                if (param.includes("=")) {
                  const [paramName, paramValue] = param.split("=");
                  eventProps[baseKey + "_" + paramName] = paramValue;
                }
              }
            }

            // Mark date-only values
            if (line.includes("VALUE=DATE")) {
              eventProps[baseKey + "_TYPE"] = "DATE";
            }
          } else if (line.includes(":")) {
            const parts = line.split(":");
            eventProps[parts[0]] = parts.slice(1).join(":");
          }
        }

        debug("Event properties:", eventProps);

        // Skip events without summary or start date
        if (!eventProps.SUMMARY || !eventProps.DTSTART) {
          debug("Skipping event without summary or start date");
          continue;
        }

        // Parse dates
        let startDate;
        if (eventProps.DTSTART_TYPE === "DATE") {
          // Parse date-only format (YYYYMMDD)
          const dateStr = eventProps.DTSTART;
          debug("Parsing date-only value:", dateStr);
          if (dateStr.length === 8) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
            const day = parseInt(dateStr.substring(6, 8));
            startDate = new Date(year, month, day);
            debug("Parsed date-only value:", startDate);
          }
        } else if (eventProps.DTSTART) {
          // Handle normal datetime format or fallback
          const dateStr = eventProps.DTSTART;
          debug("Parsing datetime value:", dateStr);
          startDate = parseDateFromICS(dateStr);
          debug("Parsed datetime value:", startDate);
        }

        if (!startDate) {
          debug("Skipping event without valid date");
          continue;
        }

        // Check for recurring events
        let isRecurring = false;
        let recurringType = 0; // 0=none, 1=daily, 2=weekly, 3=monthly, 4=yearly
        let recurringDays = "";

        if (eventProps.RRULE) {
          debug("Found recurring rule:", eventProps.RRULE);
          isRecurring = true;

          // Parse the recurrence rule
          const rruleParts = eventProps.RRULE.split(";").reduce((acc, part) => {
            if (part.includes("=")) {
              const [key, value] = part.split("=");
              acc[key] = value;
            }
            return acc;
          }, {});

          debug("Parsed RRULE:", rruleParts);

          // Determine recurrence type
          if (rruleParts.FREQ === "YEARLY") {
            recurringType = 4;
            debug("Yearly recurring event detected");

            // For yearly events, use the day of the week
            const dayOfWeek = startDate.getDay();
            recurringDays = daysOfWeek[dayOfWeek];
          } else if (rruleParts.FREQ === "MONTHLY") {
            recurringType = 3;
            debug("Monthly recurring event detected");

            // For monthly events, use the day of the week
            const dayOfWeek = startDate.getDay();
            recurringDays = daysOfWeek[dayOfWeek];
          } else if (rruleParts.FREQ === "WEEKLY") {
            recurringType = 2;
            debug("Weekly recurring event detected");

            // For weekly events, handle specific days if specified, otherwise use current day
            if (rruleParts.BYDAY) {
              // Map BYDAY values to our days format
              const byDayMap = {
                SU: "Sunday",
                MO: "Monday",
                TU: "Tuesday",
                WE: "Wednesday",
                TH: "Thursday",
                FR: "Friday",
                SA: "Saturday",
              };
              const days = rruleParts.BYDAY.split(",").map(
                (d) => byDayMap[d] || ""
              );
              recurringDays = days.filter((d) => d).join(",");
            } else {
              // Use the day of the week from the start date
              const dayOfWeek = startDate.getDay();
              recurringDays = daysOfWeek[dayOfWeek];
            }
          } else if (rruleParts.FREQ === "DAILY") {
            recurringType = 1;
            debug("Daily recurring event detected");
            // For daily events, include all days
            recurringDays =
              "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday";
          }
        }

        // Also check for birthday-type events (common in vCard imports)
        const title = eventProps.SUMMARY?.toLowerCase() || "";
        const isBirthday =
          title.includes("birthday") ||
          title.includes("bday") ||
          (eventProps.CATEGORIES &&
            eventProps.CATEGORIES.toLowerCase().includes("birthday"));

        // Birthdays are typically yearly recurring
        if (isBirthday && !isRecurring) {
          isRecurring = true;
          recurringType = 4; // yearly
          // For birthdays, use the day of the week
          const dayOfWeek = startDate.getDay();
          recurringDays = daysOfWeek[dayOfWeek];
          debug("Birthday detected, setting as yearly recurring");
        }

        const isAllDay = eventProps.DTSTART_TYPE === "DATE";

        // Set appropriate duration
        let duration = 60; // Default 1 hour
        if (isAllDay) {
          duration = 1440; // 24 hours for all-day events
        } else if (eventProps.DTEND) {
          // Calculate duration from end time if available
          const endDate = parseDateFromICS(eventProps.DTEND);
          if (endDate) {
            duration = Math.round((endDate - startDate) / 60000); // Minutes
            if (duration <= 0) duration = 60; // Default to 1h if calculation is wrong
          }
        }

        // For recurring events and especially birthdays, update the date to be in the current or future year
        // This ensures yearly recurring events from past years appear on the calendar
        if (isRecurring && recurringType === 4) {
          const currentYear = new Date().getFullYear();
          const eventYear = startDate.getFullYear();

          // If the event year is in the past, update to current year
          if (eventYear < currentYear) {
            const updatedDate = new Date(startDate);
            updatedDate.setFullYear(currentYear);

            // If the date for this year has already passed, set to next year
            if (updatedDate < new Date()) {
              updatedDate.setFullYear(currentYear + 1);
            }

            startDate = updatedDate;
            debug("Updated yearly recurring event to future date:", startDate);
          }
        }

        // Format date as YYYY-MM-DD for API
        const formattedDate = `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

        // Format time as HH:MM for API
        let hours = startDate.getHours();
        const minutes = String(startDate.getMinutes()).padStart(2, "0");
        const formattedTime = `${String(hours).padStart(2, "0")}:${minutes}`;

        // Determine category based on event properties
        let category = "Import";
        if (isBirthday) {
          category = "Birthday";
        } else if (eventProps.CATEGORIES) {
          category = eventProps.CATEGORIES;
        } else if (title.includes("meeting") || title.includes("conference")) {
          category = "Meeting";
        } else if (
          title.includes("class") ||
          title.includes("lecture") ||
          title.includes("lab")
        ) {
          category = "Class";
        } else if (
          title.includes("deadline") ||
          title.includes("due") ||
          title.includes("assignment")
        ) {
          category = "Assignment";
        }

        // Set priority
        let priority = "medium";
        if (title.includes("important") || title.includes("urgent")) {
          priority = "high";
        } else if (title.includes("optional") || title.includes("tentative")) {
          priority = "low";
        }

        const event = {
          title: eventProps.SUMMARY,
          description: eventProps.DESCRIPTION || "",
          date: formattedDate,
          time: formattedTime,
          duration: duration,
          priority: priority,
          category: category,
          recurring: recurringType,
          recurringDays: recurringDays,
          isRecurring: isRecurring,
        };

        debug("Created event object:", event);
        events.push(event);
      }

      return events;
    } catch (error) {
      console.error("Error processing ICS content:", error);
      return [];
    }
  };

  // Parse date from ICS format
  const parseDateFromICS = (dateStr) => {
    try {
      if (!dateStr || dateStr.length < 8) return null;

      if (dateStr.length === 8) {
        // Date only: YYYYMMDD
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
      } else if (dateStr.includes("T")) {
        // Date with time: YYYYMMDDTHHMMSSZ
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));

        // Extract time components
        const timeStart = dateStr.indexOf("T") + 1;
        let hour = 0,
          minute = 0,
          second = 0;

        if (timeStart > 0 && timeStart < dateStr.length) {
          hour = parseInt(dateStr.substring(timeStart, timeStart + 2) || "0");
          minute = parseInt(
            dateStr.substring(timeStart + 2, timeStart + 4) || "0"
          );
          second = parseInt(
            dateStr.substring(timeStart + 4, timeStart + 6) || "0"
          );
        }

        if (dateStr.includes("Z")) {
          return new Date(Date.UTC(year, month, day, hour, minute, second));
        } else {
          return new Date(year, month, day, hour, minute, second);
        }
      }
      return null;
    } catch (e) {
      console.error("Date parsing error:", e);
      return null;
    }
  };

  // Days of week array for recurring events
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Helper function to read file content
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // Reset the status after a delay
  const resetStatus = () => {
    setTimeout(() => {
      setUploadStatus(null);
      setStatusMessage("");
    }, 5000);
  };

  // Handle status changes
  React.useEffect(() => {
    if (uploadStatus === "success" || uploadStatus === "error") {
      resetStatus();
    }
  }, [uploadStatus]);

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        type="file"
        accept=".ics"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      {/* Upload button */}
      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        <Upload size={18} />
        Upload ICS
      </button>

      {/* Status message popup */}
      {uploadStatus && (
        <div
          className={`absolute mt-2 p-3 rounded-md shadow-lg z-10 text-sm min-w-[240px] max-w-[400px] ${
            uploadStatus === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : uploadStatus === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus === "success" ? (
              <Check size={16} className="text-green-600" />
            ) : uploadStatus === "error" ? (
              <AlertCircle size={16} className="text-red-600" />
            ) : (
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            )}
            <span className="overflow-hidden text-ellipsis">
              {statusMessage}
            </span>
            <button
              onClick={() => {
                setUploadStatus(null);
                setStatusMessage("");
              }}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICSUploader;
