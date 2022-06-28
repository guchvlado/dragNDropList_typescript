
enum ProjectStatus {Active, Finished}

class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) {}
}

// class state manager
type Listener<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn)
    }
}

class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() {
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, people: number) {
        const newProject: Project = {
            id: Math.random().toString(),
            title,
            description,
            people,
            status: ProjectStatus.Active
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
// base Component Class

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertPlace: 'afterbegin' | 'beforeend',
        elementId?: string
    ) {
        this.templateElement = document.getElementById(templateId) as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId) as T;

        const importedElement = document.importNode(this.templateElement.content, true);

        this.element = importedElement.firstElementChild as U;
        if (elementId) {
            this.element.id = elementId;
        }

        this.attach(insertPlace);
    }

    private attach(insertPlace: 'afterbegin' | 'beforeend') {
        this.hostElement.insertAdjacentElement(insertPlace, this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

//classes

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        }
        return `${this.project.people} persons`;
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, 'beforeend', project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    configure(): void {
        
    }

    renderContent(): void {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', 'beforeend', `${type}-projects`);

        this.assignedProjects = [];
        
        this.configure();

        this.renderContent();
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-project-list`) as HTMLUListElement;
        listEl.innerHTML = '';

        for (let projectItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, projectItem)
        }
    }

    renderContent() {
        const listid = `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listid;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS'
    }

    configure() {
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(item => {
                if (this.type === 'active') {
                    return item.status === ProjectStatus.Active
                }
                else if (this.type === 'finished') {
                    return item.status === ProjectStatus.Finished
                }
                else return false;
            });
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        })
    }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input', 'app', 'afterbegin', 'user-input');

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure()
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
            projectState.addProject(...userInput)
            form.reset();
        }
    }

    configure() {
        this.element.addEventListener('submit', this.sumbitHandler);
    }

    renderContent() {}
}

const projectInput = new ProjectInput()
const activeProjects = new ProjectList('active');
const finishedProjects = new ProjectList('finished');