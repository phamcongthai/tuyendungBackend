"use strict";
exports.__esModule = true;
exports.buildNameSearchQuery = void 0;
function buildNameSearchQuery(search) {
    if (!search)
        return {};
    var regex = { $regex: search, $options: 'i' };
    return {
        $or: [
            { fullName: regex },
            { email: regex },
            { phone: regex },
            { company: regex },
        ]
    };
}
exports.buildNameSearchQuery = buildNameSearchQuery;
