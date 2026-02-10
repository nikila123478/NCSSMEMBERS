declare module 'jspdf' {
    export class jsPDF {
        constructor(options?: any);
        [x: string]: any;
    }
}

declare module 'jspdf-autotable' {
    const autoTable: (doc: any, options: any) => void;
    export default autoTable;
}
