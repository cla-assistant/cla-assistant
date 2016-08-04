import { Injectable, Inject } from '@angular/core';
const json2csv = require('json2csv');

@Injectable()
export class CsvDownloadService {
  constructor(@Inject('Window') private window: Window) {}

  public downloadAsCsv(
    fileName: string,
    data: any,
    fields: string[],
    fieldHeader: string[]
  ): void {
    const csvString = json2csv({ data, fields, fieldNames: fieldHeader, del: ';' });
    this.downloadFile(fileName, csvString);
  }

  private downloadFile(fileName: string, fileContent: string) {
    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    if (this.window.navigator.msSaveBlob) {
      this.window.navigator.msSaveBlob(blob, fileName);
    } else {
      const link: any = this.window.document.createElement('a');
      if (link.download !== undefined) {
        // Browsers that support HTML5 download attribute
        const url = this.window.URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        this.window.document.body.appendChild(link);
        link.click();
        this.window.document.body.removeChild(link);
      }
    }
  }
}
