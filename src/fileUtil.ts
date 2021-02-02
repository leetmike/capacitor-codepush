import { Directory, GetUriOptions, Filesystem, Encoding } from "@capacitor/filesystem";
import { Callback } from "./callbackUtil";


/**
 * File utilities for CodePush.
 */
export class FileUtil {
    public static async directoryExists(directory: Directory, path: string): Promise<boolean> {
        try {
            const statResult = await Filesystem.stat({directory, path});
            return statResult.type === "directory";
        } catch (error) {
            return false;
        }
    }

    public static writeStringToDataFile(content: string, path: string, createIfNotExists: boolean, callback: Callback<void>): void {
        FileUtil.writeStringToFile(content, Directory.Data, path, createIfNotExists, callback);
    }

    public static async fileExists(directory: Directory, path: string): Promise<boolean> {
        try {
            const statResult = await Filesystem.stat({directory, path});
            return statResult.type === "file";
        } catch (error) {
            return false;
        }
    }

    /**
     * Makes sure the given directory exists and is empty.
     */
    public static async cleanDataDirectory(path: string): Promise<string> {
        if (await FileUtil.dataDirectoryExists(path)) {
            await FileUtil.deleteDataDirectory(path);
        }

        await Filesystem.mkdir({directory: Directory.Data, path, recursive: true});
        const appDir = await Filesystem.getUri({directory: Directory.Data, path});
        return appDir.uri;
    }

    public static async getUri(fsDir: Directory, path: string): Promise<string> {
        const result = await Filesystem.getUri({directory: fsDir, path});
        return result.uri;
    }

    public static getDataUri(path: string): Promise<string> {
        return FileUtil.getUri(Directory.Data, path);
    }

    public static dataDirectoryExists(path: string): Promise<boolean> {
        return FileUtil.directoryExists(Directory.Data, path);
    }

    public static async copyDirectoryEntriesTo(sourceDir: GetUriOptions, destinationDir: GetUriOptions, ignoreList: string[] = []): Promise<void> {
        /*
            Native-side exception occurs while trying to copy “.DS_Store” and “__MACOSX” entries generated by macOS, so just skip them
        */
        if (ignoreList.indexOf(".DS_Store") === -1){
            ignoreList.push(".DS_Store");
        }
        if (ignoreList.indexOf("__MACOSX") === -1){
            ignoreList.push("__MACOSX");
        }

        return FileUtil.copy(sourceDir, destinationDir);
    }

    public static async copy(source: GetUriOptions, destination: GetUriOptions): Promise<void> {
        await Filesystem.copy({directory: source.directory, from: source.path, to: destination.path, toDirectory: destination.directory});
    }

    /**
     * Recursively deletes the contents of a directory.
     */
    public static async deleteDataDirectory(path: string): Promise<void> {
        return Filesystem.rmdir({directory: Directory.Data, path, recursive: true}).then(() => null);
    }

    /**
     * Deletes a given set of files from a directory.
     */
    public static async deleteEntriesFromDataDirectory(dirPath: string, filesToDelete: string[]): Promise<void> {
        for (const file of filesToDelete) {
            const path = dirPath + "/" + file;
            const fileExists = await FileUtil.fileExists(Directory.Data, path);
            if (!fileExists) continue;

            try {
                await Filesystem.deleteFile({directory: Directory.Data, path});
            } catch (error) {
                /* If delete fails, silently continue */
                console.log("Could not delete file: " + path);
            }
        }
    }

    /**
     * Writes a string to a file.
     */
    public static async writeStringToFile(data: string, directory: Directory, path: string, createIfNotExists: boolean, callback: Callback<void>): Promise<void> {
        try {
            await Filesystem.writeFile({directory, path, data, encoding: Encoding.UTF8});
            callback(null, null);
        } catch (error) {
            callback(new Error("Could write the current package information file. Error code: " + error.code), null);
        }
    }

    public static async readFile(directory: Directory, path: string): Promise<string> {
        const result = await Filesystem.readFile({directory, path, encoding: Encoding.UTF8});
        return result.data;
    }

    public static readDataFile(path: string): Promise<string> {
        return FileUtil.readFile(Directory.Data, path);
    }
}
