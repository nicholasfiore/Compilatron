class Tabs {
    public static generateTabContent(program: number) {
        //generate the tab
        var tab = document.getElementById('tabbar');
        var button = document.createElement('button');
        if (program === 1) {
            button.setAttribute('class', 'nav-link active');
        } else {
            button.setAttribute('class', 'nav-link');
        }
        button.setAttribute('id', `programTab${program}`);
        button.setAttribute('data-bs-toggle', 'tab')
        // button.onclick = enterTab(parseInt(`${program}`));
        button.textContent = `Program ${program}`;

        tab.appendChild(button);

        //generate divs for the content
        var tabContent = document.getElementById('tabs');
        var currTabContent = document.createElement('div');
        currTabContent.setAttribute('id', `program${program}`);

        var tableDiv = document.createElement('div');
        tableDiv.setAttribute('id', 'table');
        var table = document.createElement('table');
        tableDiv.appendChild(table);

        var codeDiv = document.createElement('div');
        codeDiv.setAttribute('id', 'code');
        var textarea = document.createElement('textarea');
        codeDiv.appendChild(textarea);

        currTabContent.appendChild(tableDiv);
        currTabContent.appendChild(codeDiv);

        tabContent.appendChild(currTabContent);
    }
}