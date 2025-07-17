import * as React from "react";
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const dataProvider = simpleRestProvider('http://localhost:8000');

const App = () => (
    <Admin dataProvider={dataProvider}>
        <Resource name="traders" list={ListGuesser} edit={EditGuesser} show={ShowGuesser} />
        <Resource name="tokens" list={ListGuesser} edit={EditGuesser} show={ShowGuesser} />
        <Resource name="tradingideas" list={ListGuesser} edit={EditGuesser} show={ShowGuesser} />
    </Admin>
);

export default App;