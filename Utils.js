/**
 * A module that common function's lib
 * @module Utils
 */

/** Cookies utilities */
var _cookies = {
    /** get cookie by key name */
    get: function (name) {
        try {
            const re = new RegExp(`(?<=${name}=)[^;]*`);
            const item = document.cookie.split('; ').find((row) => row.startsWith(name));
            return item.split('=')[1];
            //return document.cookie.match(re)[0];	// Will raise TypeError if cookie is not found
        } catch {
            return "";
        }
    },

    /** 
     * set cookie value by key name with expiration throught  the 'hours' parameter
     * @param {string} name - key name
     * @param {string} value - value | ""
     * @param {int} hours - undefined | 0
     */
    set: function (name, value, hours) {
        var expires = "";
        try {
            value = value || "";
            hours = hours || 0;
            var date = new Date();
            //const hour = hours - date.getHours();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000)); //for days * 24
            expires = "; expires=" + date.toUTCString();
            document.cookie = name + "=" + (value || "") + expires + "; path=/";
            return true;
        } catch {
            return false;
        }
    },

    /** exist cookie */
    exist: function (sKey) {
        try {
            // Will raise TypeError if cookie is not found
            return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
            //return document.cookie.match(re)[0];	
        } catch {
            return false;
        }
    },

    /** remove cookie */
    remove: function (sKey, sPath, sDomain) {
        if (this.exist(sKey))
            this.set(sKey);
    }
}

/** 
 * Custom logger, optionaly write log to server 
 * @param {string} action - The name of the employee.
 */
var _logger = {

    /** 
     * @param {string} action action name. 
     * @param {string} msg message. 
     * @param {Object} data data object. 
     * */
    error(action, msg, data) {
        this._log('error', action, msg, data);
    },
    warn(action, msg, data) {
        this._log('warn', action, msg, data);
    },
    log(action, msg, data) {
        this._log('log', action, msg, data);
    },
    _log(severity, action, msg = "", data = undefined) {
        let bgColor;
        switch (severity) {
            case "log":
                bgColor = "#e4f7e7";
                break;
            case "info":
                bgColor = "DodgerBlue";
                break;
            case "error":
                bgColor = "#ffe6e6";
                break;
            case "warning":
                bgColor = "Orange";
                break;
            default:
                bgColor = "";
        }
        setTimeout(() => {
            try {
                msg = (msg && msg.length) ? `Message: ${msg}.` : "";
                msg = `Client ${severity}. action: ${action}.${msg}`;
                if (data) msg += `Data: ' + ${JSON.stringify(data)}`;

                console[severity](`%c${msg}`, `background: ${bgColor}`);

                // send to server
                // TODO: define url
                // this._post('url', data);
            }
            catch (e) {
                console.error(e);
            }
        });
    },
    _post: (url, data) => {
        return fetch(url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
};

/** 
 * _environment - define current environment
 */
var _environment = {
    name: 'Release',
    isDevMode: false,
    devMode(mode) {
        var devTimeout;
        if (mode) {
            this.name = 'Dev';
            this.isDevMode = true;
            devTimeout = setTimeout(() => {
                console.log(`Current environment name: ${env}.`);
            }, 1 * 24 * 3600 * 1000); // 1 day
        }
        else {
            this.name = 'Release';
            this.isDevMode = false;
            if (devTimeout)
                clearTimeout(devTimeout);
        }
    }
};

/** WRN: not comleted
 * Disclaimer, create div from template (for sunclub notifications)
 * @param {string} templateId Template Div ID
 * @param {string} elementId Root element Id for input tempalte
 * @param {string} elementOrder elementId unique order number
 */
var _disclaimer = (templateId, elementId, elementOrder) => {
    var id = `#${elementId}${elementOrder}`;
    var disclaimer = roomsContainer[0].querySelector(`id`);
    if (!disclaimer) {

        // create element from the ready template "disclaimerMoreThenTwoRoomTemplate" rendered from server
        var disclaimerTemplate = document.getElementById(templateId);
        if (disclaimerTemplate) {
            let template = disclaimerTemplate.content.cloneNode(true);
            disclaimer = template.firstElementChild;
            disclaimer.id = id;

            //var afterElements = $(roomsContainer).find('.am-filter-room-item .am-filter-room-item-title-wrapper');
            //if (afterElements.length >= 2) {
            //    afterElements[2].after(disclaimer);
            //}
        }
    }
};

/**
 * _isMobile - define true if device mobile
 */
var _isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function () {
        return (_isMobile.Android() || _isMobile.BlackBerry() || _isMobile.iOS() || _isMobile.Opera() || _isMobile.Windows());
    }
};

/**
 * _validators - validation functions
 */
var _validators = {
    /**
 * @param {Array} elementIds elemtnt ids. 
 * @param {string} disallowedChars pattern. 
 * */
    validateInputNumbers(elementIds, disallowedChars) {
        // Define the disallowed characters
        disallowedChars = disallowedChars ?? /[+\-eE.]/;
        elementIds = elementIds ?? [];

        elementIds.forEach(str => {

            const inputField = document.getElementById(str);

            const fn = function (e) {
                const char = String.fromCharCode(e.charCode);

                // Check if the pressed character is disallowed
                if (disallowedChars.test(char)) {
                    e.preventDefault(); // Prevent the character from being entered
                }
            }

            // Add a keypress event listener to the input field
            inputField?.removeEventListener("keypress", fn);
            inputField?.addEventListener("keypress", fn);
        });
    },
    /**
     * validatiion for input fields with special culture
     * @param {HTMLElement[]} elements gotten with JQuery
     * @param {string} culture 'he','fr','ru','en'
     * @returns
     */
    validateCulture(elements, culture) {
        var results = Array.from(elements).filter(element => {
            var pattern = "";
            switch (culture) {
                case 'en':
                    pattern = /^[A-Za-z ]+$/;
                    break;
                case 'fr':
                    pattern = /^[A-Za-zÀ-ÿ ]+$/;
                    break;
                case 'ru':
                    pattern = /^[А-Яа-яЁё ]+$/;
                    break;
                default:
                case 'he':
                    pattern = /^[\u0590-\u05FF ]+$/;
                    break;
            }

            var parentDiv = element.closest('div');
            var invalidFeedback = $(parentDiv).find('.invalid-feedback');
            if ($(element).is('#reg-street-house')) {
                pattern = /^[\u0590-\u05FF 0-9]+$/; //allow also digits
            }
            var text = $(element).val();
            var isValid = pattern.test(text);
            if ($(element).is('#he-first-name') || $(element).is('#he-last-name')) {
                if ($(element).val() === '')
                    isValid = true;
            }
            if (!isValid) {
                $(element).removeClass('valid-field');
                $(element).addClass('invalid-field');

                if (text.length === 0)
                    invalidFeedback.text(invalidFeedback.data('invalid-feedback'));
                else
                    invalidFeedback.text(invalidFeedback.data('validation-error'));

                invalidFeedback.css('display', 'block');
            }
            else {
                $(element).addClass('valid-field');
                $(element).removeClass('invalid-field');
                invalidFeedback.text(invalidFeedback.data('invalid-feedback'));
                invalidFeedback.css('display', 'none');
            }
            return isValid;
        });

        return results.length == elements.length;
    },

    isValidIsraeliID(id) {
        return _isValidIsraelPassortId(id);
    },
    validateIsraeliPhoneNumber(phoneNumber) {
        // Define the regular expression pattern for an Israeli mobile number
        var israeliPhonePattern = /^05[0-9]{8}$/;

        // Test the input against the pattern
        return israeliPhonePattern.test(phoneNumber);
    },
    validatePhoneNumber(input, channel) {
        var phoneNumber = input.val();
        var phonePattern = /^\d{10,15}$/;
        var isValid = (channel == 'TANIS' || channel == 'TAUSD') && phoneNumber.length == 0 ? true : phonePattern.test(phoneNumber);
        if (!isValid) {
            this.showValidationError(input, channel == 'WHENIS' || channel == 'WENUSD');
        }
        else {
            this.clearValidationError(input);
        }
        return isValid;
    },
    validateEmail(input, channel) {
        var email = input.val();
        var emailPattern = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;// /^\+?\d{10,15}$/;
        var isValid = (channel == 'TANIS' || channel == 'TAUSD') && email.length == 0 ? true : emailPattern.test(email);
        if (email == '' && (channel == 'WHENIS' || channel == 'WENUSD')) {
            isValid = true;
        }
        if (!isValid) {
            this.showValidationError(input, channel == 'WHENIS' || channel == 'WENUSD');
        }
        else {
            this.clearValidationError(input);
        }
        return isValid;
    },
    validatePassportId(input, channel) {
        var isValid = true;
        if (channel == 'TAUSD' && input.val().length) {
            isValid = _validatePassportIdEgentsEn(input.val());
        }
        else if (channel == 'WHENIS') {
            isValid = _isValidIsraelPassortId(input.val());
        }
        if (isValid && input.attr('id') === 'reg-partner-id' && $('input[name="partner-exists"]').val() === '1') {
            var mainPassport = $('#input-check-passport').length ? $('#input-check-passport').val() : $('#reg-id').val();
            isValid = mainPassport != input.val();
            if (isValid)
                this.clearValidationError(input);
            else
                this.showValidationError(input, true, true);

            return isValid;
        }
        if (!isValid) {
            this.showValidationError(input);
        }
        else {
            this.clearValidationError(input);
        }
        return isValid;
    },
    validateTermAgreement() {
        if (($('#agreement').is(':checked'))) {
            this.clearValidationError($('#agreement'));
            return true;
        }
        else {
            var parentDiv = $('#agreement').closest('div');
            var invalidFeedback = $(parentDiv).find('.invalid-feedback');
            $('#agreement').removeClass('valid-field');
            $('#agreement').addClass('invalid-field');
            invalidFeedback.css('display', 'block');
            return false;
        }
    },
    clearValidationError(input) {
        var parentDiv = input.closest('div');
        var invalidFeedback = $(parentDiv).find('.invalid-feedback');
        $(input).addClass('valid-field');
        $(input).removeClass('invalid-field');
        invalidFeedback.text(invalidFeedback.data('invalid-feedback'));
        invalidFeedback.css('display', 'none');
    },
    showValidationError(input, isRequiredField, isEqualValidation = false) {
        var parentDiv = input.closest('div');
        var invalidFeedback = $(parentDiv).find('.invalid-feedback');
        $(input).removeClass('valid-field');
        $(input).addClass('invalid-field');

        if (input.val().length === 0 && isRequiredField === true)
            invalidFeedback.text(invalidFeedback.data('invalid-feedback'));
        else if (input.val().length > 0 && isEqualValidation)
            invalidFeedback.text(invalidFeedback.data('equal-validation'));
        else if (input.val().length > 0)
            invalidFeedback.text(invalidFeedback.data('validation-error'));

        invalidFeedback.css('display', 'block');
    },
    showValidationErrorForOptionalInput(input) { //in case input is optional and should only show error for format
        var parentDiv = input.closest('div');
        var invalidFeedback = $(parentDiv).find('.invalid-feedback');
        $(input).removeClass('valid-field');
        $(input).addClass('invalid-field');

        invalidFeedback.text(invalidFeedback.data('validation-error'));
        invalidFeedback.css('display', 'block');
    },
    validateUserNamePassword(input) {
        // Define a regular expression pattern for English letters, numbers, and common symbols
        var pattern = /^[a-zA-Z0-9\s\.,!?@#$%^&*()_+{}\[\]:;<>=~\\|/'"-]+$/;
        return pattern.test(input);
    },
    validatePassword(input) {
        if (this.validateUserNamePassword(input.val())) {
            this.clearValidationError(input);
        }
        else {
            this.showValidationError(input);
        }
    },
    highlightInvalidInput(inputElement, errorMsg, dictionaryKey) {
        inputElement.closest('.am-input').find('.invalid-feedback').text(errorMsg);
        inputElement.closest('.am-input').find('.invalid-feedback').attr('data-dictionary', dictionaryKey);
        inputElement.removeClass('valid-field');
        inputElement.addClass('invalid-field');
    },
    isValidIsraeliID(id, isCanBeEmpty) {
        if (isCanBeEmpty && id.trim() === '')
            return true;

        // checks if a string variable id consists only of zeros.
        if (/^0+$/.test(id)) {
            return false;
        }

        // Make sure ID is formatted properly
        if (id.length < 7 || id.length > 9 || isNaN(id) || id === '000000018') {
            return false;
        }

        // checks passport id validation
        let sum = 0, incNum;
        for (let i = 0; i < id.length; i++) {
            incNum = Number(id[i]) * ((i % 2) + 1);  // Multiply number by 1 or 2
            sum += (incNum > 9) ? incNum - 9 : incNum;  // Sum the digits up and add to total
        }
        var isValid = (sum % 10 === 0);
        return isValid;
    },
    validateIsraeliPhoneNumber(phoneNumber) {
        // Define the regular expression pattern for an Israeli mobile number
        var israeliPhonePattern = /^05[0-9]{8}$/;

        // Test the input against the pattern
        return israeliPhonePattern.test(phoneNumber);
    },
    isValidDateTime(datetimeString, isCanBeEmpty) {
        // Define a regular expression for the expected datetime format
        const datetimeRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        // If the string is empty, consider it as valid
        if (datetimeString.trim() === '' && isCanBeEmpty) {
            return true;
        }
        // Check if the string matches the expected format
        if (!datetimeRegex.test(datetimeString)) {
            return false;
        }

        // Split the date string into day, month, and year
        var dateArray = datetimeString.split('/');

        // Create a Date object with the provided values (months are 0-based in JavaScript)
        var inputDate = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);

        // Get the current date
        var currentDate = new Date();

        // Compare the input date with the current date
        if (inputDate > currentDate) {
            // The input date is in the future
            return false;
        } else {
            // The input date is valid
            return true;
        }
    },
    ValidateObject(sunClubObject) {
        var isSpouseValid = true;
        if ($("#partner-section").is(":visible")) {

            var sFirstName = this.validateCulture($('#reg-partner-firstName'), 'he');
            if (!sFirstName) {
                $('#reg-partner-firstName').removeAttr("style").removeClass('valid-field').addClass('invalid-field');
                $('#reg-partner-firstName').next('.invalid-feedback').css('display', 'block');
            } else {
                $('#reg-partner-firstName').removeAttr("style").addClass('valid-field').removeClass('invalid-field');
                $('#reg-partner-firstName').next('.invalid-feedback').css('display', 'none');
            }

            var sLastName = this.validateCulture($('#reg-partner-lastName'), 'he');
            if (!sLastName) {
                $('#reg-partner-lastName').removeAttr("style").removeClass('valid-field').addClass('invalid-field');
                $('#reg-partner-lastName').next('.invalid-feedback').css('display', 'block');
            } else {
                $('#reg-partner-lastName').removeAttr("style").addClass('valid-field').removeClass('invalid-field');
                $('#reg-partner-lastName').next('.invalid-feedback').css('display', 'none');
            }
            if ($('#reg-partner-phone').length) {
                var sPhone = this.validatePhoneNumber($('#reg-partner-phone'), 'WHENIS');
                if (!sPhone) {
                    $('#reg-partner-phone').removeAttr("style").removeClass('valid-field').addClass('invalid-field');
                    $('#reg-partner-phone').next('.invalid-feedback').css('display', 'block');
                } else {
                    $('#reg-partner-phone').removeAttr("style").addClass('valid-field').removeClass('invalid-field');
                    $('#reg-partner-phone').next('.invalid-feedback').css('display', 'none');
                }
            }

            var sPassportId = this.isValidIsraeliID(sunClubObject.SpousePassportId, false)
            if (!sPassportId) {
                $('#reg-partner-id').removeAttr("style").removeClass('valid-field').addClass('invalid-field');
                $('#reg-partner-id').next('.invalid-feedback').css('display', 'block');
            } else {
                $('#reg-partner-id').removeAttr("style").addClass('valid-field').removeClass('invalid-field');
                $('#reg-partner-id').next('.invalid-feedback').css('display', 'none');
            }
            isSpouseValid = sFirstName && sPassportId;

        }
        var isBirthdayValid = this.isValidDateTime(sunClubObject.Birthday, false);
        if (!isBirthdayValid) {
            $('#reg-birthDay').removeAttr("style").removeClass('valid-field').addClass('invalid-field');
            $('#reg-birthDay').next('.invalid-feedback').css('display', 'block');
        } else {
            $('#reg-birthDay').removeAttr("style").addClass('valid-field').removeClass('invalid-field');
            $('#reg-birthDay').next('.invalid-feedback').css('display', 'none');
        }

        return isSpouseValid && isBirthdayValid;
    }
};

/**
 * lazy load by element selector, that it requires to include the cssClass "lazy"
 * @param {string} elementSelector selector for find element, by id or class
 */
function _lazyLoad(elementSelector) {

    var lazyLoadPromise = new Promise((resolve, reject) => {
        var observedElements = [].slice.call(document.querySelectorAll(elementSelector));

        try {
            if ("IntersectionObserver" in window) {

                let lazyObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            let target = entry.target;
                            if (target.tagName === "IMG" && target.dataset.src && target.dataset.src !== "") {
                                target.src = target.dataset.src;
                                target.srcset = target.dataset.src;
                                target.classList.remove('lazy');
                            }
                            observer.unobserve(target);
                        }
                    });

                    const intersectedEntries = entries.filter(entry => entry.isIntersecting)
                    if (intersectedEntries.length > 0)
                        resolve(intersectedEntries.map(x => x.target));
                }, {
                    rootMargin: "100px 100px 100px 100px"
                });

                observedElements.forEach(function (lazyElement) {
                    lazyObserver.observe(lazyElement);
                });
            }
            else {
                const errMsg = 'lazyLoad error: IntersectionObserver not supported in current browser!';
                logger.error(errMsg);
                reject(errMsg);
            }
        } catch (e) {
            const errMsg = `lazyLoad error: ${e}`;
            logger.error(errMsg);
            reject(errMsg);
        }
    });

    return lazyLoadPromise;
}

/**
 * dynamic Load dependences: js and css
 * @param {string | Array} jsUrls js urls
 * @param {string | Array} cssUrls js css
 */
function _dynamicLoad(jsUrls, cssUrls, callBackPromise) {

    var cssUrlsPromise = _cssLoad(cssUrls)
        .then(_ => {
            callBackPromise()
                .then(_ => {
                });
        })

    var jsUrlsPromise = _scriptLoad(jsUrls);

    return Promise.all([cssUrlsPromise, jsUrlsPromise])
        .then((values) => {
            const msg = `${values[0].length + values[1].length} dynamic resources has been loaded`;
            _logger.log(msg);
            return { status: true, message: msg };
        })
        .catch((error) => {
            const msg = `Load dynamic resources error: ${error.message}`;
            _logger.log(msg);
            return { status: false, message: msg };
        });
}

/**
 * load external script dynamically, on current host
 * @param {Array} urls script urls
 */
function _scriptLoad(urls, type = 'text/javascript') {

    urls = Array.isArray(urls) ? urls : [urls];

    var promises = urls.map((url) =>
        new Promise((resolve, reject) => {
            try {
                if (document.querySelector(`head > script[src="${url}"]`) !== null) {
                    const msg = `Dynamic script ${url} allredy loaded`;
                    return resolve({ status: true, message: msg });
                }

                // Adding the script tag to the head as suggested before
                var head = document.head;
                var script = document.createElement('script');

                // Then bind the event to the callback function.
                // There are several events for cross browser compatibility.
                script.onreadystatechange = () => {
                    _logger.log(`Dynamic script ${script.src} ready`);

                };

                // Optional - on successful load & error
                script.onload = () => {
                    const msg = `Dynamic script ${script.src} loaded`;
                    _logger.log(msg);
                    setTimeout(() => {
                        resolve({ status: true, message: msg });
                    }, 100);
                };
                script.onerror = e => {
                    const msg = `Error loading ${script.src}: ${e}`;
                    _logger.error(msg);
                    reject({ status: false, message: msg });
                }

                script.type = type;
                script.async = false;
                script.src = url;

                // Fire the loading
                head.appendChild(script);

            } catch (e) {
                const msg = `Error loading ${script.src}: ${e}`;
                _logger.error(msg);
                reject({ status: false, message: msg });
            }
        })
    );

    return Promise.all(promises)
        .then((values) => values)
        .catch((error) => error);
}

/**
 * load external css dynamically
 * @param {Array} urls script urls
 */
function _cssLoad(urls, type = 'text/css') {

    urls = Array.isArray(urls) ? urls : [urls];

    var promises = urls.map((url) =>
        new Promise((resolve, reject) => {
            try {
                var stylesheet = document.createElement("link");
                stylesheet.rel = "stylesheet";
                stylesheet.type = type;
                stylesheet.href = url;

                // Optional - on successful load & error
                stylesheet.onload = () => {
                    const msg = `Dynamic css ${stylesheet.href} loaded`;
                    _logger.log(msg);
                    resolve({ status: true, message: msg });
                }
                stylesheet.onerror = e => {
                    const msg = `Error loading ${stylesheet.href}: ${e}`;
                    _logger.error(msg);
                    reject({ status: false, message: msg });
                }

                // Append <link> tag to <head>
                document.head.appendChild(stylesheet);
            } catch (e) {
                const msg = `Error loading ${url}: ${e}`;
                _logger.error(msg);
                reject({ status: false, message: msg });
            }
        })
    );

    return Promise.all(promises)
        .then((values) => values)
        .catch((error) => error);
}

/**
 * datepicker, based on jquery-ui
 * @param {object} event
 * @param {object} options selectors
 */
function _datepickerInit(event, options) {
    // options validation
    if (!options?.datepickerSelector || !options?.inputSelector) {
        _logger.error(`datepickerInit options error: datepickerSelector or inputElementSelector are not defined`);
        return;
    }

    // parent popup document
    const doc = document; //event?.parent?.document;

    // options validation
    var datepickerElement = doc.getElementById(options.datepickerSelector);
    if (!datepickerElement) {
        _logger.error(`datepickerInit error: datepickerElement is not defined`);
        return;
    }
    var container = datepickerElement.closest('form')
        ?? datepickerElement.closest('[role="dialog"]')
        ?? doc.body;

    let datepickerOptions;
    if ("rtl" === doc.dir) {
        datepickerOptions = {
            closeText: "סגור",
            prevText: "הקודם",
            nextText: "הבא",
            currentText: "היום",
            monthNames: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
            monthNamesShort: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יוני", "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ"],
            dayNames: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
            dayNamesShort: ["א", "ב", "ג", "ד", "ה", "ו", "ש"],
            dayNamesMin: ["א", "ב", "ג", "ד", "ה", "ו", "ש"],
            weekHeader: "Wk",
            dateFormat: "dd/mm/yy",
            firstDay: 0,
            isRTL: !0,
            showMonthAfterYear: !1,
            yearSuffix: "",
            minDate: 0
        }
    } else {
        datepickerOptions = {
            weekHeader: "Wk",
            dateFormat: "dd/mm/yy",
            firstDay: 1,
            isRTL: !1,
            showMonthAfterYear: !1,
            yearSuffix: "",
            minDate: 0
        }
    }

    var datepicker = $(datepickerElement).datepicker(datepickerOptions);
    //datepicker.on("change", function () {
    //    _dateText = datepicker.val();
    //})
    datepicker.hide();

    container.querySelector('[data-action="datepickerBack"]') //'.sm-see-datepicker-cancel-btn'
        ?.addEventListener("click", (e) => datepicker.hide());

    container.querySelector('[data-action="datepickerDone"]') //'.sm-see-datepicker-done-btn'
        ?.addEventListener("click", (e) => {
            var sendInputElement = container.querySelector(options.inputSelector);
            if (sendInputElement)
                sendInputElement.value = datepicker.val();
            datepicker.hide();
            e.preventDefault();
            e.stopPropagation();
        });

    container.querySelector(options.inputSelector) //'#smDateInput'
        ?.addEventListener("click", (e) => datepicker.show());

    //containerElement.querySelector('.ui-datepicker-next')
    //    .addEventListener("click", (e) => {
    //    });
}

HTMLElement.prototype.datepickerInit = _datepickerInit;

/**
 * selectOnFocus - for all number inputs doing select number before input
 * @param {event} event
 * @param {object} options selectors
 */
function _selectOnFocus(event, options) {

    if (!options?.inputListSelector) {
        _logger.error(`datepickerInit options error: inputSelector are not defined`);
        return;
    }

    // parent popup document
    const doc = event?.parent?.document ?? document;

    var container = event?.action?.form
        ?? event.action?.element?.closest('form')
        ?? event.action?.element?.closest('[role="dialog"]')
        ?? doc.body;

    var inputs = container.querySelectorAll(options.inputListSelector);
    inputs.forEach(x => x.addEventListener('focus', (e) => {
        if (e.target && e.target.value) {
            e.target.select();
            e.preventDefault();
            return false;
        }
    }));
}

/**
 * inputCodeNumber - for all number inputs doing select number before input
 * @param {event} event
 * @param {object} options selectors
 */
function _inputCodeNumber(event, options) {

    if (!options?.inputListSelector) {
        _logger.error(`datepickerInit options error: inputListSelector are not defined`);
        return;
    }

    // parent popup document
    const doc = event?.parent?.document ?? document;

    var container = event?.action?.form
        ?? event.action?.element?.closest('form')
        ?? event.action?.element?.closest('[role="dialog"]')
        ?? doc.body;

    const e = container.querySelectorAll(options.inputListSelector);
    let t = !1;

    e && e.forEach((e => {
        const s = e.querySelectorAll("._code_input_field");
        s && s.forEach((e => {
            e.addEventListener("input", (e => {
                if (t)
                    return;
                const { target: i } = e
                    , a = i.value.slice(0, 1);
                i.value = a;
                const r = a ? 1 : -1
                    , n = [...s].findIndex((e => e === i))
                    , l = n + r;
                l < 0 || l >= s.length || s[l].focus()
            }
            )),
                e.addEventListener("focus", (e => {
                    const { target: t } = e
                        , i = [...s].findIndex((e => e === t));
                    0 < i && !s[i - 1].value && s[i - 1].focus()
                }
                )),
                e.addEventListener("keydown", (e => {
                    if ("Backspace" === e.code && !e.target.value) {
                        e.preventDefault();
                        const t = [...s].findIndex((t => t === e.target));
                        t > 0 && s[t - 1].focus()
                    }
                }
                )),
                e.addEventListener("paste", (e => {
                    t = !0,
                        e.preventDefault();
                    let i = e.clipboardData.getData("text/plain").replace(/\D/, "");
                    if (i) {
                        i = [...i],
                            i.forEach(((e, t) => {
                                t + 1 <= s.length && (s[t].value = e)
                            }
                            ));
                        let e = i.length >= s.length ? s.length - 1 : i.length - 1;
                        s[e].focus()
                    }
                    setTimeout((() => {
                        t = !1
                    }
                    ), 50)
                }
                ))
        }
        ))
    }
    ))
}

/** spinner */
function _spinner() {
    return {
        show: (actionName) => {
            let event = this._events[actionName];
            if (event) {
                const spinner = event.actionElement.getElementsByClassName('spinner-border')[0];
                if (spinner) {
                    const labels = spinner.parentElement.getElementsByTagName('label');
                    if (labels && labels[0]) labels[0].classList.add("d-none");
                    spinner.classList.remove("d-none");
                }
            }
        },
        hide: (actionName) => {
            let event = this._events[actionName];
            if (event) {
                const spinner = event.actionElement.getElementsByClassName('spinner-border')[0];
                if (spinner) {
                    const labels = spinner.parentElement.getElementsByTagName('label');
                    if (labels && labels[0]) labels[0].classList.remove("d-none");
                    spinner.classList.add("d-none");
                }
            }
        }
    }
}

/** 
 * scrollElementTo 
 * @param {HTMLElement} element
 * @param {{ top: number, left: number, behavior: 'auto' | 'smooth' | 'instant', align: 'top' | 'center' | 'bootom' }} options
 */
function _scrollElementTo(element, options) {
    options = Object.assign({ top: 0, left: 0, behavior: "auto", bottom: 0, align: 'top' }, options);

    if (options.align)
        switch (options.align) {
            case 'center':
                // Calculate the scroll position to center the element
                const elementRect = element.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const scrollY = window.scrollY || window.pageYOffset;
                top = Number.isInteger(Number(top)) ? Number(top) : 0;
                options.top = elementRect.top + scrollY - (windowHeight / 2 - elementRect.height / 2);
                break;
            case 'bottom':
                options.top = window.innerHeight - (options.bottom | 0);
                break;
            case 'top':
            default:
        }

    //element.scrollIntoView({
    //    behavior: 'auto', // You can change this to 'auto' for instant scrolling
    //    block: 'center', // Scroll vertically to the center of the viewport
    //    //inline: 'center', // Scroll horizontally to the center of the viewport
    //});

    // Scroll to the calculated position without animation
    window.scrollTo(options);
}

function _isValidIsraelPassortId(id) {
    if (/^0+$/.test(id)) {
        return false;
    }

    // Make sure ID is formatted properly
    if (id.length < 7 || id.length > 9 || isNaN(id) || id === '000000018') {
        return false;
    }

    // checks passport id validation
    let sum = 0, incNum;
    for (let i = 0; i < id.length; i++) {
        incNum = Number(id[i]) * ((i % 2) + 1);  // Multiply number by 1 or 2
        sum += (incNum > 9) ? incNum - 9 : incNum;  // Sum the digits up and add to total
    }
    var isValid = (sum % 10 === 0);
    return isValid;
}

function _validatePassportIdEgentsEn(id) {
    // Regular expression pattern for a passport number
    var pattern = /^[A-Za-z0-9]{9,9}$/;
    // Check if the passport number matches the pattern
    if (id.match(pattern)) {
        return true;
    } else {
        return false;
    }
}

function _getFormModel(formName) {
    var form = document.forms[formName];
    const values = {};
    Array.from(form.elements)
        .filter(tag =>
            ["select", "textarea", "input"].includes(tag.tagName.toLowerCase()))
        .forEach(element => {
            if (element.name) {  // Ensure the element has a name attribute
                values[element.name] = element.value;
            }
        });
    return values;
}

/**
 * Utils, exports functions
 */
export {
    _cookies as cookies,
    _lazyLoad as lazyLoad,
    _scriptLoad as scriptLoad,
    _cssLoad as cssLoad,
    _dynamicLoad as dynamicLoad,
    _logger as logger,
    _spinner as spinner,
    _isMobile as isMobile,
    _disclaimer as disclaimer,
    _datepickerInit as datepickerInit,
    _selectOnFocus as selectOnFocus,
    _inputCodeNumber as inputCodeNumber,
    _validators as validators,
    _scrollElementTo as scrollElementTo,
    _getFormModel as getFormModel
}