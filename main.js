const googleForm = {
    actionUrl: "https://docs.google.com/forms/d/e/1FAIpQLSckqCLPaUPJS40pRQHDrkYtI27RhsMei8VGev2tYhCsz7kkWQ/formResponse",
    entries: {
        guestName: "entry.1153771433",
        attendance: "entry.1133770559",
        guestCount: "entry.1454670260",
        additionalGuests: "entry.887331011"
    }
};

const rsvpForm = document.getElementById("rsvpForm");
const successCard = document.getElementById("successCard");
const formStatus = document.getElementById("formStatus");
const closeSuccessButton = document.getElementById("closeSuccess");
const guestCount = document.getElementById("guestCount");
const additionalGuestsWrap = document.getElementById("additionalGuestsWrap");
const additionalGuestsInput = document.getElementById("additionalGuests");

function isGoogleFormConfigured() {
    return googleForm.actionUrl.includes("formResponse") &&
        Object.values(googleForm.entries).every(entry => !entry.includes("REPLACE"));
}

function setStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status ${type || ""}`.trim();
}

function getSelectedAttendance() {
    const selected = rsvpForm.querySelector("input[name='attendance']:checked");
    return selected ? selected.value : "";
}

function getRsvpValues() {
    return {
        [googleForm.entries.guestName]: document.getElementById("guestName").value.trim(),
        [googleForm.entries.attendance]: getSelectedAttendance(),
        [googleForm.entries.guestCount]: document.getElementById("guestCount").value,
        [googleForm.entries.additionalGuests]: additionalGuestsInput ? additionalGuestsInput.value.trim() : ""
    };
}

function showSuccess() {
    if (!rsvpForm || !successCard) return;

    rsvpForm.closest(".form-card").hidden = true;
    successCard.hidden = false;
    successCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateAdditionalGuestsField() {
    if (!guestCount || !additionalGuestsWrap || !additionalGuestsInput) return;

    const selectedCount = Number(guestCount.value);
    const shouldShow = selectedCount >= 2;

    additionalGuestsWrap.hidden = !shouldShow;
    additionalGuestsInput.required = shouldShow;
    additionalGuestsInput.value = shouldShow ? additionalGuestsInput.value.trim() : "";

    if (!shouldShow) {
        additionalGuestsInput.removeAttribute("aria-invalid");
    }
}

function resetFormState() {
    if (!rsvpForm) return;

    rsvpForm.reset();

    if (guestCount) guestCount.value = "1";
    updateAdditionalGuestsField();

    const submitButton = rsvpForm.querySelector("button[type='submit']");
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit RSVP";
    }

    setStatus("", "");
}

function closeSuccess() {
    if (!successCard) return;
    successCard.hidden = true;

    const formCard = document.querySelector(".form-card");
    if (formCard) formCard.hidden = false;

    resetFormState();
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function submitToGoogleForm(values) {
    return new Promise(resolve => {
        const iframeName = "googleFormSubmitFrame";
        let iframe = document.querySelector(`iframe[name="${iframeName}"]`);

        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.name = iframeName;
            iframe.hidden = true;
            document.body.appendChild(iframe);
        }

        const googlePostForm = document.createElement("form");
        googlePostForm.action = googleForm.actionUrl;
        googlePostForm.method = "POST";
        googlePostForm.target = iframeName;
        googlePostForm.hidden = true;

        Object.entries(values).forEach(([name, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            googlePostForm.appendChild(input);
        });

        document.body.appendChild(googlePostForm);

        iframe.addEventListener("load", () => {
            googlePostForm.remove();
            resolve();
        }, { once: true });

        googlePostForm.submit();

        setTimeout(() => {
            if (document.body.contains(googlePostForm)) googlePostForm.remove();
            resolve();
        }, 2500);
    });
}

if (rsvpForm && successCard) {
    guestCount.addEventListener("change", updateAdditionalGuestsField);
    updateAdditionalGuestsField();

    rsvpForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (guestCount && Number(guestCount.value) >= 2 && !additionalGuestsInput.value.trim()) {
            setStatus("Please enter the names of additional guests.", "error");
            additionalGuestsInput.focus();
            additionalGuestsInput.setAttribute("aria-invalid", "true");
            return;
        }

        if (!isGoogleFormConfigured()) {
            setStatus("Google Form endpoint is set. Add the entry IDs in main.js to finish connecting it.", "error");
            return;
        }

        const submitButton = rsvpForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        setStatus("Sending your RSVP...", "loading");

        try {
            await submitToGoogleForm(getRsvpValues());
            showSuccess();
        } catch (error) {
            setStatus("Something went wrong. Please try again.", "error");
            submitButton.disabled = false;
            submitButton.textContent = "Submit RSVP";
        }
    });
}

if (closeSuccessButton) {
    closeSuccessButton.addEventListener("click", closeSuccess);
}
