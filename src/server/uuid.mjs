export async function generateUUID() {
    const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (var1) {
        let var2 = (Math.random() * 16) | 0,
            var3 = var1 == 'x' ? var2 : (var2 & 0x3) | 0x8;
        return var3.toString(16);
    });
    const object = {
        id: newId,
    };
    return Promise.resolve(object);
}

export async function isUUID(userId) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return Promise.resolve(uuidRegex.test(userId));
}
