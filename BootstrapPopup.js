/**
 * A module that common function's lib
 * @module BootstrapPopup
 */

import { logger as popupLogger, scriptLoad as popupScriptLoad }
    from '/Static/Site/Scripts/Modules/Utils.js';

/** 
 * Create instance base on bootstrap.Modal, 
 * optionlly with the ajax call to server PartialView. 
 *  Encludes subscribing to events: 
 * 'popupBeforeShow', 'popupAfterShow', 'popupBeforeClose', 'popupAfterClose'
 * @class
 */
class BootstrapPopup extends bootstrap.Modal {

    /** 
     * current popup divId 
     *  @type {string} 
    */
    _divId = undefined;

    _model = {};

    _isBind = false;

    /** 
     * current popup element
     *  @type {HTMLElement} 
    */
    _element = undefined;

    /** 
     * current popup element
     *  @type {Document} 
    */
    _document = undefined;

    /** 
     * ctor, where parameters are: divId - main div with css class of bootstrap; data - data modal { viewName: undefined, url: undefined } 
     * @constructor ctor
     * @param {string} divId, 
     * @param {object} model
     * @param { partialViewName: undefined, partialViewUrl: undefined, partialViewLoadJs: [], partialViewLoadCss: [], culture: string, rootNodeId: string} options
     */
    constructor(divId, model = {}, options = {
        partialViewName: undefined, partialViewUrl: undefined,
        partialViewLoadJs: [], partialViewLoadCss: [],
        culture: undefined,
        rootNodeId: undefined
    }) {
        super(_makeElement(options))

        this._document = options.ownerDocument ?? window.top.document;
        this._options = options;
        this._divId = divId;
        this._model = model;
        this._element = options.element; // document.getElementById(divId);
        this._element.tabIndex = '-1';
        this._element.focus();
        this._element._events = this._element._events ?? new Map(); 
        this._element._eventListenerList = this._element._eventListenerList ?? new Map(); 

        /**
         * create html Element by divId
         * @param {{ partialViewName: undefined, partialViewUrl: undefined, partialViewLoadJs: [], partialViewLoadCss: [], culture: string, rootNodeId: string, element: HTMLElement, ownerDocument: Document}} options where element is dynamicaly created element by call _makeElement()
        */
        function _makeElement(options) {
            var doc = options.ownerDocument
                ?? (window.top !== window.self ? window.top.document : window.self.document);

            let element = doc.getElementById(divId);

            if (!element && options.partialViewName) {
                element = _initElement(document, divId, model, options);
            }

            if (!element) {
                popupLogger.error(`Popup error: element '${divId}' not found!`);
                return null;
            }

            doc.body.insertBefore(element, doc.body.childNodes[0]);
            options.element = element;
            return element;
        };

        /**
         * init html Element from partialView
         * @param {string} divId
         * @param {object} model
         * @param {object} options
         * @param {document} doc it is top document 
        */
        function _initElement(doc, divId, model, options) {
            
            let errMessage = "";
            let element;

            try {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", options.partialViewUrl, false);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("X-Culture", options?.culture ?? culture ?? doc.body.getAttribute('data-culture') ?? "he-IL");
                xhr.setRequestHeader("X-RootNodeId", options?.rootNodeId ?? doc.body.getAttribute('data-home-node-id') ?? "1050");

                /* timeout after a minute */
                let timeout = setTimeout(() => { xhr.abort(); }, 2 * 60 * 1000);
                const data = { popupName: options.partialViewName, ...model };

                xhr.send(JSON.stringify(data));

                xhr.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        clearTimeout(timeout);
                        errMessage = `Partial popup ${options.partialViewName} timeout. Url: ${options.partialViewUrl}`;
                    }
                }

                if (xhr.status == 200) {
                    clearTimeout(timeout);
                    //popupLogger.log(`Partial popup ${options.partialViewName} success. DivId: ${divId}. Url: ${options.partialViewUrl}`);

                    var el = doc.createElement('div');
                    el.id = divId;
                    el.innerHTML = xhr.responseText.trim();
                    element = el.firstChild;
                    element.setAttribute('uniqueId', `${divId}-${Date.now().toString(36) + Math.random().toString(36).substring(2)}`);

                    return element;
                }
                else {
                    errMessage = `Partial popup ${options.partialViewName} error status: ${xhr.status}. Url: ${options.partialViewUrl}`;
                }
            } catch (e) {
                errMessage = `Partial popup ${options.partialViewName} exception: ${e}. Url: ${options.partialViewUrl}`;
            }

            popupLogger.error(errMessage);
            var el = doc.createElement('div');
            el.id = divId;
            el.innerHTML = `Partial popup ${divId} error`;
            element = el.firstChild;
            return element;
        }

        /**
         * unbind from bootstrap events and buttons
         * @param {HTMLElement} newElement
        */
        this._unbind = (element) => {
            try {
                //element = element || this._element;
                //if (element && this._element._events) {
                //    Object.keys(this._element._events).forEach(key => {
                //        element.removeEventListener(key, this._element._events.get(key).callback);
                //    });
                //}
            } catch (e) {
                popupLogger.error(`fn unbind error: ${JSON.stringify(e)}`);
            }
            this._isBind = false;
        }

        /**
         * bind to bootstrap events and buttons
         * @param {HTMLElement} newElement
        */
        this._bind = (newElement) => {

            this._element = newElement ?? this._element;

            // set attribute data-partialView, it using to desribe the html in browser only
            if (this._element) {
                this._element.removeAttribute("data-partialView");
                this._element.setAttribute("data-partialView", this._options.partialViewName);
            }

            // make nad bind tabs controls
            const tabs = this._document.querySelectorAll(".tab-pane");
            if (tabs) this._bindToTabControl(tabs);

            // map to bootstrap events
            this._mapBootstrapEvent(this._element, 'show.bs.modal', "popupBeforeShow");
            this._mapBootstrapEvent(this._element, 'shown.bs.modal', "popupAfterShow");
            this._mapBootstrapEvent(this._element, 'hide.bs.modal', "popupBeforeClose");

            // uniqueId defined for the multi instsnse popup class (temporary not used)
            this._element.setAttribute('uniqueId', Date.now().toString(36) + Math.random().toString(36).substring(2));
            this._element.isUnbind = false;

            // fn help clean background shadow of the popup dialog div
            let hiddenBsModalAction = () => {
                if (this._element._events.has('popupAfterClose') && !this._element.isUnbind) {
                    this._element.removeEventListener('hidden.bs.modal', hiddenBsModalAction);

                    this._unbind(this._element);
                    this._element.isUnbind = true;
                    this.hide();
                    this.fireEvent('popupAfterClose');

                    // clean bootstrap backdrop
                    const backdropCollection = this._document.body.getElementsByClassName('modal-backdrop');
                    [...backdropCollection].forEach(x => x.remove());
                }
            }
            this._element.addEventListener('hidden.bs.modal', hiddenBsModalAction);
        }

        /**
         * bind to forms
         * @param {string} formId
        */
        this._bindToFormControl = (formId) => {
            const getFormElements = element =>
                Array.from(element.elements)
                    .filter(tag =>
                        ["select", "textarea", "input"].includes(tag.tagName.toLowerCase()));

            var form = this._element.parentNode.querySelector("#" + formId);
            if (form) {
                form.addEventListener('submit', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (form.checkValidity()) {
                        var inputs = getFormElements(form);
                    }
                }, false)
            }
        };

        /**
         * bind to TabControlmao
         * @param {array<string>} panes
        */
        this._bindToTabControl = (panes) => {
            const linkTabs = this._document.querySelectorAll("[data-target]");
            Object.keys(linkTabs).map((tab) => {
                linkTabs[tab].addEventListener("click", (e) => {
                    linkTab(e);
                });
            });

            function linkTab(e) {
                let elem = e.target;
                if (e.target.tagName == 'LABEL')
                    elem = e.target.parentElement;

                const attr = elem.getAttribute("data-toggle");
                if (attr === 'tab') {
                    makeInactive(linkTabs);
                }
                else {
                    var tabsElements = this._document.getElementsByClassName('nav nav-pills')
                    if (tabsElements.length)
                        tabsElements[0].style.display = "none";
                }

                activateTab(e);
                makeInactive(panes);

                // activate tab
                var tab = activateTabContent(elem);
                if (tab) {
                    const forms = tab.getElementsByTagName('form');
                    if (forms && forms[0])
                        this._bindToFormControl(forms[0].id);
                }

                e.preventDefault();
            }
            function makeInactive(items) {
                Object.keys(items).map((item) => {
                    const elem = items[item];
                    elem.classList.remove("active");
                });
            }
            function activateTab(e) {
                //refers to the element whose event listener triggered the event
                const clickedTab = e.currentTarget;
                clickedTab.classList.add("active");

            }
            function activateTabContent(elem) {
                // gets the element on which the event originally occurred
                //const anchorReference = e.target;
                const activePaneID = elem.getAttribute("data-target");
                const activePane = this._document.querySelector(activePaneID);
                activePane.classList.add("active");
                return activePane;
            }
        };

        /**
         * bind actionElement to ActionEvent by Action data attribute
         * @param {string} actionName
         * @param {HTMLElement} actionElement
         */
        this._bindToAction = (actionName, actionElement, callback) => {
            if (this._element._events.has(actionName)) return;

            let event = PopupActionEventFactory.Create(actionName, { element: actionElement, parent: this, callBack: callback });
            this._element._events.set(actionName, event);
            actionElement.actionEvent = event;

            if (['BUTTON', 'A', 'LI'].includes(actionElement.tagName)) {
                this._addActionEventListener(actionElement, "click", this._actionHandler);
            }
        }

        this._actionHandler = (e) => {
            setTimeout(() => {
                var targetElement = e.target;
                if (e.target.nodeName === "LABEL") {
                    targetElement = e.target.parentNode;
                }
                this.fireEvent(targetElement.actionEvent);
            });
            e.preventDefault();
        }

        this._stateEngine = {
            current: undefined,
            transitions: {
            },
            transitionTo(newState) {
                const possibleStates = this.transitions[this.currentState];

                if (possibleStates.includes(newState)) {
                    this.currentState = newState;
                }
            },
            getCurrentState() {
                return this.currentState;
            }
        };

        /** addEventListener, if not exist
         * @param {HTMLElement} element
         * @param {string} actionName
         * @param {actionCallback} callback
        */
        this._addActionEventListener = (element, actionName, callback) => {
            element._eventListenerList = element._eventListenerList ?? new Map();

            if (!element._eventListenerList.has(actionName)) {
                element.addEventListener(actionName, callback, false);
            }
            element._eventListenerList.set(actionName, callback);
        }

        /** 
         * map to bootstrap events
         * @param {HTMLElement} element
         * @param {string} popupActionName
         * @param {PopupActionEvent} event
         */
        this._mapBootstrapEvent = (element, bootstrapEventName, popupActionName) => {
            if (!element._eventListenerList.has(popupActionName)) {
                var mapEventCallback = () => { this.fireEvent(popupActionName) };
                this._addActionEventListener(element, bootstrapEventName, mapEventCallback);
            }
            element._events.set(popupActionName, new PopupActionEvent(popupActionName, { parent: this, callback: mapEventCallback }));
        }

        // execute bind
        this._bind();
    }

    /** current options */
    get options() {
        return this._options;
    }

    /** current divId */
    get divId() {
        return this._divId;
    }

    /** current model */
    get model() {
        return this._model;
    }

    /** current element */
    get element() {
        return this._element;
    }

    /** current document */
    get document() {
        return this._document;
    }

    /** show popup */
    show = () => {
        if (this._element.innerHTML != "") {
            if (Array.isArray(this._options.partialViewLoadJs) && this._options.partialViewLoadJs.length > 0) {
                popupScriptLoad(this._options.partialViewLoadJs).then(_ => super.show());
            }
            else {
                super.show();
            }
        }
    }

    /** close popup */
    hide = () => {
        super.hide();
    }

    /**
     * @callback actionCallback
     * @param {PopupActionEvent} event
     */
    /**
     * subscribe on event of popup 
     * @param {string} actionName - event action name, as such as, 'popupSubmit'
     * @param {actionCallback} callback - callBack(event)
     */
    on = (actionName, callback) => {
        
        this._addActionEventListener(this.element, actionName, callback);

        const dataActions = this._document.querySelectorAll(`[data-action="${actionName}"]`);

        Object.keys(dataActions).map((dataActionNum) => {
            this._bindToAction(actionName, dataActions[dataActionNum], callback);
        });
    }

    /** fire the data-action event, for example, event popupSubmit or popupError
     * @param {string | PopupActionEvent} actionName actionName = eventType
     * @param {PopupActionEvent} args
     */
    fireEvent = (actionName, args) => {
        /** @type {PopupActionEvent} */
        var event = actionName instanceof Event ? actionName : this._element._events.get(actionName);
        if (!event) return;

        event.action = { ...event.action, ...args };

        if (!event.target && event.action.element) {
            Object.defineProperty(event, 'target', { value: event.action.element });
            Object.defineProperty(event, 'currentTarget', { value: event.action.element });
        }

        const type = event.action.element?.getAttribute("type") ?? "";
        const form = event.action.form ?? event.action.element?.form ?? event.action.element?.closest('form');

        if (type == "submit" && form) {
            try {
                if (!form.checkValidity()) {
                    event.stopPropagation();
                    form.classList.add('was-validated', 'form-invalid');
                    let invalidMessage = event.feedback?.dataset?.invalid;
                    this.fireEvent('popupError', { message: invalidMessage, form: form });
                }
                else {
                    event.action.formData = form.elements;
                    form.classList.add('was-validated', 'form-valid')
                    this.fireEvent('popupError', { message: "", form: form, formData: form.elements });
                    this._element.dispatchEvent(event);
                }
            }
            catch (ex) {
                popupLogger.error(`PopupSubmit. Element ${this.divId}`, `Event ${event.type} ex:${ex}`, event);
            }
        }
        else {
            this._element.dispatchEvent(event);
        }
    }

    spinner = (event, isShow) => {
        let spinner = event.action?.element?.querySelector('[data-action="popupSpinner"]');
        if (spinner) {
            if (isShow)
                spinner.classList.remove('d-none');
            else
                spinner.classList.add('d-none');
        }
    }
}

/**
 * create the bubble event base on CustomEvent, 
 * that maybe to listen in parent html elements
 */
class PopupActionEvent extends CustomEvent {
    _actionForm = undefined;
    _parent = undefined;

    /**
     * @param {{divId: string, element: HTMLElement, data: object, parent: BootstrapPopup, callback: Function }} args - arguments of event
    */
    constructor(type, args) {
        super(type, { bubbles: true });
        args = args || {};
        args.parent = args.parent ?? args.parent._document.getElementById(args.parent?.element?.id || 'body');
        args.element = args.element ?? args.parent._element.querySelector(`[data-action="${type}"]`);
        this._parent = args.parent;

        /**
         * @type {{
            parent: BootstrapPopup | class,
            parentElement: HTMLElement,
            element: HTMLElement, dataDefault: object, 
            message: string, error: {},
            form: HTMLElement,
            callback: Function
            }}
        */
        this.action = {
            ...args,
            dataDefault: undefined,
            message: args.message || undefined,
            error: undefined,
            form: args?.form || args.element?.form || args.element?.closest('form')
        }
    }

    /** @type {HTMLElement} - feedback element */
    get feedback() {
        const topElement = this.action.form || this.action.parentElement;
        return topElement?.querySelector(`[data-action="popupError"]`);;
    }

    /** parent class ref */
    get parent() {
        return this._parent;
    }

    /** @type {HTMLElement} - parent element */
    get actionForm() {
        return this.action.form;
    }
    set actionForm(value) {
        this.action.form = value;
        this.action.formData = this.action._form?.elements;
    }

    getActiveForm = () => {
        var activeElement = this._document.activeElement;
        while (activeElement && activeElement.nodeName !== 'FORM') {
            activeElement = activeElement.parentNode;
        }
        return activeElement;
    }
}
class PopupTabToggleActionEvent extends CustomEvent {
    constructor(type, args) {
        super(((type, args) => {
            if (args.tabNavId && args.tabContentId && args.tabId) {
                this.action.callback = () => {
                    execute(args.tabNavId, args.tabContentId, args.tabId);
                };
            }
        })(type, args));
    }

    // Function to change the active tab programmatically
    execute = (tabNavId, tabContentId, tabId) => {

        // Get the tab navigation element
        var tabNav = args.parent._document.getElementById(tabNavId);

        // Get the tab content element
        var tabContent = args.parent._document.getElementById(tabContentId);

        // Find the desired tab link and activate it
        var tabLink = tabNav.querySelector('[href="#' + tabId + '"]');
        if (tabLink)
            tabLink.classList.add('active');

        // Find the desired tab pane and activate it
        var tabPane = tabContent.querySelector('#' + tabId);
        if (tabPane)
            tabPane.classList.add('show', 'active');

        // Deactivate other tab links and panes
        var allTabLinks = tabNav.querySelectorAll('.nav-link');
        var allTabPanes = tabContent.querySelectorAll('.tab-pane');

        for (var i = 0; i < allTabLinks.length; i++) {
            if (allTabLinks[i] !== tabLink) {
                allTabLinks[i].classList.remove('active');
            }
        }

        for (var j = 0; j < allTabPanes.length; j++) {
            if (allTabPanes[j] !== tabPane) {
                allTabPanes[j].classList.remove('show', 'active');
            }
        }
    }
}

/**
 * PopupActionEventFactory create instance of PopupActionEvent event 
 *   public static methods: Create, EventList
 */
class PopupActionEventFactory {

    /**
     * @param {string} actionName
     * @param {{ element: HTMLElement, parent: PopupActionEvent, callBack: actionCallback }} args
     */
    static Create(actionName, args) {
        /** @type {PopupActionEvent } */
        let event;
        switch (actionName) {
            case 'popupTabToggle':
                event = new PopupTabToggleActionEvent(actionName, args)
            default:
                event = new PopupActionEvent(actionName, args)
        }
        return event;
    }
}

export { BootstrapPopup, PopupActionEvent }