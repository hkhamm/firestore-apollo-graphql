export interface User {
    id: string
    name: string
    username: string
    password: string
}

export interface Message {
    id: string
    text: string
    date: string
    userId: string
}

export interface Messages {
    data: Message[]
    cursor: string
}
