// Observer Interface
interface ChessObserver {
    update(message: string): void;
}

// Subject Class
class Subject {
    private observers: ChessObserver[] = [];

    attach(observer: ChessObserver): void {
        this.observers.push(observer);
    }

    detach(observer: ChessObserver): void {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(message: string): void {
        for (const observer of this.observers) {
            observer.update(message);
        }
    }
}
