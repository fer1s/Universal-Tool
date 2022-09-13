import { ChildProcess, spawn } from "child_process";
import { Token, setProgress, setFinish, outputConsole } from "../Queue/main.js";
import config from '../../config.json' assert {type: 'json'};

const regex: {[index: string]: RegExp} = {
    moviepyProgress: /t:[a-zA-Z0-9% ]*\|[a-zA-Z0-9%# ]*\| *([0-9]*)\/([0-9]*) *\[[0-9]*:[0-9]*<([0-9]*:[0-9]*)/,
};

const messageFromProcess = function(this: Process, message: string) {
    let type = null;

    if(message.startsWith('[INFO] ')) {
        message = message.slice(7);
        type = 'info';
    } else if(message.startsWith('[ERROR] ')) {
        message = message.slice(8);
        type = 'error';
    } else if(message.startsWith('[WARNING] ')) {
        message = message.slice(10);
        type = 'warning';
    } else if(message.startsWith('[SUCCESS] ')) {
        message = message.slice(10);
        type = 'success';
    } else if(message.startsWith('[PROGRESS] ')) {
        message = message.slice(11);

        if(message.toString().length > 0) {
            let progress: number = parseInt(message);
            setProgress(this.token, progress);
        }
        return;
    } else if(message.startsWith('[DEBUG] ')) {
        message = message.slice(8);
        
        if(config.consoleDebug) {
            console.log(`[DEBUG] [${this.token}] ${message}`);
        }

        return;
    } else if(message.startsWith('[FINISH] ')) {
        message = message.slice(9);
        setFinish(this.token, message);
        return;
    } else if(regex.moviepyProgress.test(message)) {
        let match: RegExpExecArray | null = regex.moviepyProgress.exec(message);
        if(match) {
            let progress: number = parseInt(match[1])/parseInt(match[2]);
            setProgress(this.token, progress*100);
        }
        return;
    }

    if(!type) return;

    outputConsole(this.token, type, message);
}

const multipleMessages = function(this: Process, data: any) {
    let messages: string[] = data.toString('utf8').replaceAll(/(\r\n|\n|\r)/gm, '\n').split('\n').filter((a: string) => a.length > 0);

    for(let message of messages) {
        messageFromProcess.bind(this)(message);
    }
}

export class Process {
    token: Token;
    process: ChildProcess;

    constructor(name: string, token: Token, params: string[]) {
        this.process = spawn('python.exe', [`python/${name}.py`, ...params]);
        this.token = token;

        outputConsole(this.token, 'INFO', 'Starting python process...');

        this.process?.stdout?.on('data', multipleMessages.bind(this));
        this.process?.stderr?.on('data', multipleMessages.bind(this));
    }
}