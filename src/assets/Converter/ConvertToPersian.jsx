const convertToPersian = (num) => {
    return num.toString().replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
};

export default convertToPersian;