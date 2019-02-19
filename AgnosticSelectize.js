class AgnosticSelectize {
    constructor(item) {
        this.chips = [];
        this.selectedChips = [];
        this.dropDown = undefined;
        this.inputField = undefined;
        this.selectize = typeof item === 'string' ? document.querySelector(item) : item;

        this.state = {
            data: [],
            autoComplete: false,
            dropDownChildren: [],
            callback: undefined
        }

        this.removeChip = this.removeChip.bind(this);
        this.closeDropDown = this.closeDropDown.bind(this);
        this.refreshDropDown = this.refreshDropDown.bind(this);
        this.addDataToDropDown = this.addDataToDropDown.bind(this);
        this.dropDownItemListeners = this.dropDownItemListeners.bind(this);
        this.inputFieldKeyUpListener = this.inputFieldKeyUpListener.bind(this);
        this.init();
    }

    // Starts all the magic
    init() {
        this.initInput();
        this.listeners();
    }

    // Creates the input field
    initInput() {
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.selectize.appendChild(this.inputField);
    }

    // Creates the selected chip
    createChip(data) {
        const chipAnim = [
            {opacity: 0},
            {opacity: 1}
        ];
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = data.label;
        this.selectize.insertBefore(chip, this.inputField);
        chip.animate(chipAnim, { duration: 250 });

        this.chips.push(chip);
        this.selectedChips.push({ label: data.label });

        chip.addEventListener('click', this.removeChip);

        if (this.state.autoComplete) {
            this.closeDropDown();
            this.constraintDropDownToParent();   
        }
    }

    // Creates the drop down
    createDropDown() {
        this.dropDown = document.createElement('ul');
        this.dropDown.className = 'drop-down';
        this.selectize.appendChild(this.dropDown);
        this.constraintDropDownToParent();
    }

    // Removes the drop down
    removeDropDown() {
        if (this.state.autoComplete) {
            this.selectize.removeChild(this.dropDown);
        }
    }

    // Closes the drop down
    closeDropDown() {
        if (this.state.autoComplete) {
            this.setState({data: []}, this.refreshDropDown);
        }
    }

    // Update the drop down content
    refreshDropDown() {
        // Clear the drop down before adding new items
        this.dropDown.innerHTML = '';
        const self = this;

        // Checks if data exist in state
        if (this.state.data.length > 0) {
            this.dropDown.classList.remove('closed');
            let dropDownChildren = [];

            // Creates the drop down items
            this.state.data.map(item => {
                const dropDownItem = document.createElement('li');
                dropDownItem.textContent = item.label;
                dropDownItem.className = 'drop-down-item';
                self.dropDown.appendChild(dropDownItem);

                // Adds the dropdown item to the drop down items holder
                dropDownChildren.push(dropDownItem);
            });

            // Adds the dropdown item to state
            // and re-attach listeners
            this.setState({
                dropDownChildren: dropDownChildren
            }, this.dropDownItemListeners);

        } else {
            this.dropDown.classList.add('closed');
        }
    }

    // Adds drop down items to state
    addDataToDropDown(data) {
        if (this.state.autoComplete) {
            this.setState({data: data}, this.refreshDropDown);
        }
    }

    // Makes sure the drop down stays at the bottom of
    // it's parent
    constraintDropDownToParent() {
        const parentProps = this.selectize.getBoundingClientRect();
        const root = document.documentElement;
        root.style.setProperty('--drop-down-position-top', `${parentProps.height}px`);
    }

    // Removes added chip
    removeChip(e) {
        const chip = e.target;
        const chipIndex = this.chips.indexOf(chip);

        this.selectedChips.splice(chipIndex, 1);
        this.selectize.removeChild(chip);
    }

    // Attaches listeners
    listeners() {
        this.inputField.addEventListener('keydown', (e) => {
            switch (e.which) {
                case 13:
                    this.createChip({ label: this.inputField.value });
                    this.inputField.value = '';
                    break;
            }
        });

        // Close the drop down if any item that is not
        // the drop down or any of it's children if any
        // dom item is clicked
        document.addEventListener('click', (e) => {
            if (this.dropDown !== undefined &&
                !e.target.classList.contains('drop-down-item')
                && !e.target.classList.contains('chip')
                && !this.dropDown.classList.contains('closed')) {
              this.closeDropDown();
            }
          });
    }

    // Input field keyup event listener handler
    inputFieldKeyUpListener(e) {
        if (e.target.value.length > 0) {
            this.constraintDropDownToParent();
            this.state.callback(e);
        }
    }

    // Attaches listener to drop down items
    dropDownItemListeners() {
        this.state.dropDownChildren.map(item => {

            // Drop down item event listener
            item.addEventListener('click', (e) => {
                const data = {
                    label: e.target.textContent
                };

                // Creates chip every time a drop down
                // item is clicked
                this.createChip(data);
                this.inputField.value = '';
                this.inputField.focus();
            });
        });
    }

    // Handles instance state data
    setState(newState, callback) {
        for (const key in newState) {
            if (newState.hasOwnProperty(key)) {
                this.state[key] = newState[key];
            }
        }

        // Executes callback function IFF it's a function
        if (typeof callback === 'function') callback();
    }
}

// Allows the user to get selected chips
AgnosticSelectize.prototype.getSelectedItems = function() {
    return this.selectedChips;
}

// Allows the user to get selected chips as CSV
AgnosticSelectize.prototype.getSelectedItemsAsString = function() {
    let itemString = '';
    this.selectedChips.map((item, i) => {
        itemString += item.label + (i !== this.selectedChips.length - 1 ? ',' : '');
    });
    return itemString;
}

// Allows the user to toggle autocomplete
AgnosticSelectize.prototype.autoComplete = function(autoComplete) {
    const self = this;
    if (autoComplete) {

        // Enables autocomplete and creates the drop down
        this.setState({autoComplete: true}, this.createDropDown());
    } else {
        // Disables autocomplete,
        // Empties the drop down data,
        // Removes the drop down
        // Removes keyup event listener from the input field
        this.setState({
            autoComplete: false,
            data: []
        }, () => {
            self.removeDropDown();
            self.inputField.removeEventListener('keyup', this.inputFieldKeyUpListener);
        });
    }
}

// Polpulates data for the drop down if enebled
AgnosticSelectize.prototype.fill = function(data) {
    this.addDataToDropDown(data);
}

// Allows for action during value change of input.
AgnosticSelectize.prototype.onChange = function(callback) {
    const self = this;

    // Attaches keyup event listener to the input field IFF autocomplet
    // is enabled, and adds the callback function to state
    if (this.state.autoComplete) {
        this.setState({callback: callback}, () => {
            self.inputField.addEventListener('keyup', this.inputFieldKeyUpListener);
        });
    }
}

// Allows the user to style chips
AgnosticSelectize.prototype.style = (props) => {
    const {
        outlined, filled, background,
        color, rounded, radius, outlineWidth,
        outlineStyle
    } = props;

    const root = document.documentElement;

    root.style.setProperty('--chip-color', color);

    if (outlined) {
        root.style.setProperty('--chip-outline-width', outlineWidth);
        root.style.setProperty('--chip-outline-color', background);
        root.style.setProperty('--chip-outline-style', outlineStyle);
        root.style.setProperty('--chip-background', 'none');
    }

    if (rounded && radius !== undefined) {
        root.style.setProperty('--chip-radius', radius);
    }

    if (filled) {
        root.style.setProperty('--chip-background', background);
        root.style.setProperty('--chip-outline-width', '0');
        root.style.setProperty('--chip-outline-color', 'none');
        root.style.setProperty('--chip-outline-style', 'none');
    }
}