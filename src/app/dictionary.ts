import { shuffle } from "shuffle-seed";
import * as base32 from "hi-base32";
import { getNumberFromDate } from "@/utils/dailyNumber";
import secrets from "@/data/secrets";
import words from "@/data/words";

export default class Dictionary {
    private static _instance: Dictionary;

    private dailySeed: string;
    private validWordsSeed: string;

    private _valid_words: string[];
    private _valid_words_map: Map<string, number>;
    private _secrets: string[];
    private _secrets_map: Map<string, number>;

    private constructor(dailySeed?: string, validWordsSeed?: string) {
        this.dailySeed = dailySeed || process.env.DAILY_SEED!;
        this.validWordsSeed = validWordsSeed || process.env.VALID_WORDS_SEED!;
        this._secrets = this.getShuffledSecrets();
        this._valid_words = this.getShuffledValidWords();
        this._valid_words_map = this.listToMap(this._valid_words);
        this._secrets_map = this.listToMap(this._secrets);
    }

    public static getInstance(dailySeed?: string, validWordsSeed?: string): Dictionary {
        if (!Dictionary._instance) {
            Dictionary._instance = new Dictionary(dailySeed, validWordsSeed);
        }
        return Dictionary._instance;
    }

    public getTodaysSecret(): string {
        const today = new Date();
        return this.getDailySecret(today);
    }

    public getDailySecret(date: Date): string {
        return this.getSecretFromNumber(getNumberFromDate(date));
    }

    public getCodeForAnswer(answer: string): string {
        const fake = this.getFakeFromSecret(answer)!;
        return base32.encode(fake);
    }

    public getDailySecretCode(date: Date): string {
        const answer = this.getDailySecret(date);
        return this.getCodeForAnswer(answer);
    }

    public getAnswerFromCode(code: string): string | null {
        const fake = base32.decode(code);
        return this.getSecretFromFake(fake);
    }

    public getValidWords(): string[] {
        return this._valid_words;
    }

    public getValidWordsMap(): Map<string, number> {
        return this._valid_words_map;
    }

    public getSecrets(): string[] {
        return this._secrets;
    }

    public getRandomSecret(): string {
        const randomIndex = Math.floor(Math.random() * this._secrets.length);
        return this._secrets[randomIndex];
    }

    public isValidWord(word: string): boolean {
        return this._valid_words_map.has(word);
    }

    private getSecretFromNumber(number: number): string {
        const limit = this._secrets.length;
        const secretIndex = ((number % limit) + limit) % limit;
        return this._secrets[secretIndex];
    }

    private getFakeFromSecret(secret: string): string | null {
        const index = this._secrets_map.get(secret);
        if (!index) return null;
        return this._valid_words[index];
    }

    private getSecretFromFake(word: string): string | null {
        const index = this._valid_words_map.get(word);
        if (!index) return null;
        return this._secrets[index];
    }

    private getShuffledSecrets(): string[] {
        return shuffle([...secrets], this.dailySeed);
    }

    private getShuffledValidWords(): string[] {
        return shuffle([...words, ...secrets], this.validWordsSeed);
    }

    private listToMap(list: string[]): Map<string, number> {
        const map = new Map<string, number>();
        for (let i = 0; i < list.length; i++) {
            map.set(list[i], i);
        }
        return map;
    }
}
