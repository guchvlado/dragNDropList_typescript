// class state manager
class ProjectState {
    private projects: any[] = [];
    private listeners: any[] = [];
    private static instance: ProjectState;

    private constructor() {

    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn)
    }

    addProject(title: string, description: string, people: number) {
        const newProject = {
            id: Math.random().toString(),
            title,
            description,
            people
        }
        this.projects.push(newProject)
        for (let listenerFn of this.listeners) {
            listenerFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance();

interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;

    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0
    }
    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }

    return isValid;
}


function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const newDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            return descriptor.value.bind(this)
        }
    }
    return newDescriptor
}
//classes

class ProjectList {
    projectInput: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;

    constructor(private type: 'active' | 'finished') {
        this.projectInput = document.getElementById('project-list') as HTMLTemplateElement;
        this.hostElement = document.getElementById('app') as HTMLDivElement;

        const importedElement = document.importNode(this.projectInput.content, true);

        this.element = importedElement.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`;
        
        this.attach();
        this.renderContent();
    }

    private renderContent() {
        const listid = `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listid;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS'
    }

    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}

class ProjectItem {

}

class ProjectInput {
    projectInput: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.projectInput = document.getElementById('project-input') as HTMLTemplateElement;
        this.hostElement = document.getElementById('app') as HTMLDivElement;

        const importedElement = document.importNode(this.projectInput.content, true);

        this.element = importedElement.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input'

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure()
        this.attach()
    }
    
    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = +this.peopleInputElement.value;

        const titleValid: Validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValid: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }
        const peopleValid: Validatable = {
            value: enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if (
            !validate(titleValid) ||
            !validate(descriptionValid) ||
            !validate(peopleValid)
        ) {
            alert('invalid input, please try again!')
            return;
        }
        else return [
            enteredTitle,
            enteredDescription,
            enteredPeople
        ]
    }

    @autobind
    private sumbitHandler(e: Event) {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            console.log(...userInput)
            form.reset();
        }
    }

    private configure() {
        this.element.addEventListener('submit', this.sumbitHandler);
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}

const projectInput = new ProjectInput()
const activeProjects = new ProjectList('active');
const finishedProjects = new ProjectList('finished');