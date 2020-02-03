/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
let dataType = null;
let tabPanel = null;

CampusExplorer.buildQuery = function () {
    let query = {};
    dataType = getDataType();
    tabPanel = document.getElementById(`tab-${dataType}`);
    if ((dataType === "rooms" || dataType === "courses") && tabPanel) {
        buildCondition(query);
        const transformations = getTransformations();
        buildOptions(query, getTransKeys(transformations));
        buildTransformations(query, transformations);
    }
    return query;
};

function getDataType() {
    const tab = document.getElementsByClassName("nav-item tab active")[0];
    if (tab) {
        return tab.getAttribute("data-type");
    }
    return "courses";
}

function buildCondition(query) {
    query.WHERE = {};
    const ids = ["conditiontype-all", "conditiontype-any", "conditiontype-none"];
    let logicalOperator = "all"; // default
    for (const id of ids) {
        const radioElement = document.getElementById(`${dataType}-${id}`);
        if (isChecked(radioElement)) {
            logicalOperator = getValue(radioElement);
        }
    }
    const conditions = getConditions();
    if (conditions.length === 0) {
        return;
    }
    switch (logicalOperator) {
        case "all":
            if (conditions.length === 1) {
                query.WHERE = conditions[0];
            } else {
                query.WHERE.AND = conditions;
            }
            break;
        case "any":
            if (conditions.length === 1) {
                query.WHERE = conditions[0];
            } else {
                query.WHERE.OR = conditions;
            }
            break;
        case "none":
            if (conditions.length === 1) {
                query.WHERE.NOT = conditions[0];
            } else {
                query.WHERE.NOT = {};
                query.WHERE.NOT.OR = conditions;
            }
            break;
    }
}

function buildOptions(query, transKey) {
    query.OPTIONS = {};
    buildColumns(query, transKey);
    buildOrder(query, transKey);
}

function buildColumns(query, transKey) {
    query.OPTIONS.COLUMNS = getCheckedColumns("columns", transKey);
}

function buildOrder(query, transKeys) {
    const orderKeys = getOrderKeys(transKeys);
    if (orderKeys.length === 0) {
        return;
    }
    let order = {};
    if (orderKeys.length === 1 && !isOrderDescending()) {
        order = orderKeys[0];
    } else {
        order = {};
        order.keys = orderKeys;
        order.dir = isOrderDescending() ? "DOWN" : "UP";
    }
    query.OPTIONS.ORDER = order;
}

function buildTransformations(query, applyList) {
    buildGroups(query);
    if (applyList.length !== 0) {
        query.TRANSFORMATIONS.APPLY = applyList
    }
}

function buildGroups(query) {
    const groups = getCheckedColumns("groups");
    if (groups.length !== 0) {
        query.TRANSFORMATIONS = {};
        query.TRANSFORMATIONS.GROUP = groups;
    }
}

function getTransformations() {
    const transformationForm = document.getElementsByClassName("form-group transformations")[0];
    const transformationGroups = transformationForm.getElementsByClassName("transformation");
    const transformations = [];
    for (const transformationGroup of transformationGroups) {
        let transformation = {};
        const operator = getSelectedValues(transformationGroup, "operators")[0];
        const term = getValue(getInput(transformationGroup.getElementsByClassName("term")[0]));
        const field = getSelectedValues(transformationGroup, "fields")[0];
        if (term) {
            transformation[term] = {};
            transformation[term][operator] = `${dataType}_${field}`;
            transformations.push(transformation);
        }
    }
    return transformations;
}

function isOrderDescending() {
    const descendingCheckBox = tabPanel.getElementsByClassName("descending")[0];
    return !!isChecked(getInput(descendingCheckBox));
}

function getOrderKeys(transKeys) {
    const orderForm = tabPanel.getElementsByClassName("form-group order")[0];
    const orderFields = getSelectedValues(orderForm, "order fields");
    const orderKeys = [];

    for (const field of orderFields) {
        const orderKey = transKeys.includes(field) ? field : `${dataType}_${field}`;
        orderKeys.push(orderKey);
    }
    return orderKeys;
}

function getConditions() {
    const conditionElements = tabPanel.getElementsByClassName("condition");
    const conditions = [];
    for (const conditionElement of conditionElements) {
        let condition = {};
        const notCheckBox = getInput(conditionElement.getElementsByClassName("not")[0]);
        if (isChecked(notCheckBox)) {
            condition.NOT = getCondition(conditionElement);
        } else {
            condition = getCondition(conditionElement);
        }
        conditions.push(condition);
    }
    return conditions;
}

function getCondition(conditionElement) {
    let condition = {};
    const operator = getSelectedValues(conditionElement, "operators")[0];
    const field = `${dataType}_${getSelectedValues(conditionElement, "fields")[0]}`;
    const term = getValue(getInput(conditionElement.getElementsByClassName("term")[0]));
    condition[operator] = {};
    if (!isNaN(term) && field !== "courses_uuid") {
        condition[operator][field] = +term;
    } else {
        condition[operator][field] =term;
    }
    return condition;
}

function getCheckedColumns(className, transKey = []) {
    const columnForm = tabPanel.getElementsByClassName(`form-group ${className}`)[0];
    const controlFields = columnForm.getElementsByClassName("control");
    const columns = [];
    for (const field of controlFields) {
        const columnCheckBox = getInput(field);
        if (isChecked(columnCheckBox)) {
            const dataKey = columnCheckBox.getAttribute("data-key");
            const column = transKey.includes(dataKey) ? dataKey : `${dataType}_${dataKey}`;
            columns.push(column);
        }
    }
    return columns;
}

function getTransKeys(applyList) {
    const transKeys = [];
    for (const applyItem of applyList) {
        transKeys.push(Object.keys(applyItem)[0]);
    }
    return transKeys;
}


function getSelectedValues(element, className) {
    const options = element.getElementsByClassName(className)[0].getElementsByTagName("option");
    const values = [];
    for (const option of options) {
        if (isSelected(option)) {
            values.push(getValue(option));
        }
    }
    return values;
}

function getInput(element) {
    return element.getElementsByTagName("input")[0];
}

function getValue(element) {
    return element.getAttribute("value");
}

function isChecked(element) {
    return element.getAttribute("checked") === "checked";
}

function isSelected(element) {
    return element.getAttribute("selected") === "selected";
}
