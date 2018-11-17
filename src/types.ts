export interface User {
    id: string
    name: string
    email: string
    password: string
}

export interface Message {
    id: string
    likes: number
    text: string
    userId: string
}
