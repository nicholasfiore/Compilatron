class Tabs {
    public static generateTabContent(program: number) {
        //generate the tab
        let tab = document.getElementById('tabbar');
        let button = document.createElement('button');
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
        let tabContent = document.getElementById('tabs');
        let currTabContent = document.createElement('div')
    }
}