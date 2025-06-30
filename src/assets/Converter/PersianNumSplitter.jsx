const PersianNumberSplitter = (number) => {
    if (number == null || number === "") return "";
    return Math.abs(number).toLocaleString("fa-IR"); 
};

export default PersianNumberSplitter;