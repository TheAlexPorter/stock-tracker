import axios from 'axios';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import SweetAlert from 'sweetalert2-react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  FormControl,
  FormGroup,
  Grid,
  Row,
  Col,
  Button,
} from 'react-bootstrap';

import './styles.css';

const palette = [
  '#3cb44b',
  '#911eb4',
  '#4363d8',
  '#f58231',
  '#42d4f4',
  '#e6194B',
];

class App extends Component {
  constructor() {
    super();

    this.state = {
      stocks: [],
      stocksData: [],
      inputValue: '',
      currentStocks: ['AAPL'],
      tickers: 0,
      initialLoad: false,
      showError: false,
      lastSearched: '',
    };
  }

  componentDidMount() {
    this.state.currentStocks.forEach((stock) => this.getStock(stock));
  }

  handleChange = (e) => {
    const value = e.target.value;
    if (!value.includes('_')) {
      this.setState({
        inputValue: value.toUpperCase().replace(/\W/g, ''),
      });
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.addStock();
    }
  };

  addStock = () => {
    const updatedStocks = [
      ...new Set([...this.state.currentStocks, this.state.inputValue]),
    ];

    if (
      this.state.inputValue !== '' &&
      !isEqual(updatedStocks, this.state.currentStocks)
    ) {
      this.setState({ currentStocks: [...new Set(updatedStocks)] }, function() {
        this.getStock(
          this.state.currentStocks[this.state.currentStocks.length - 1]
        );
      });
    }

    this.setState({ inputValue: '' });
  };

  getStock = (stockTicker) => {
    axios(`https://api.iextrading.com/1.0/stock/${stockTicker}/chart/3m`)
      .then((data) => {
        const stockName = stockTicker.toUpperCase();
        const newStock = data.data.map((stock) => {
          return {
            name: stock.date,
            [stockName]: stock.close,
            stockName: stockName,
          };
        });

        this.setState(
          { stocks: [...this.state.stocks, newStock] },
          function() {}
        );
      })
      .then(() => {
        this.compileStockData();
        this.showTickers();
      })
      .catch((err) => {
        console.log(`Unable to find data for ${stockTicker}`, err);
        const removedTicker = this.state.currentStocks.slice(0, -1);
        this.setState({
          currentStocks: removedTicker,
          showError: true,
          lastSearched: stockTicker,
        });
      });
  };

  compileStockData = () => {
    let { stocks } = this.state;
    let compiledStocks = [];
    const length = stocks[0] ? stocks[0].length : 0;
    const total = stocks.length;

    for (let i = 0; i < length; i++) {
      let newStock = {};
      for (let j = 0; j < total; j++) {
        newStock[stocks[j][i].stockName] = stocks[j][i][stocks[j][i].stockName];
        newStock.name = stocks[j][i].name;
      }

      compiledStocks.push(newStock);
    }
    this.setState({ stocksData: compiledStocks });
    if (!this.state.initialLoad) {
      this.setState({ initialLoad: true });
    }
  };

  deleteStock = (id) => {
    const { currentStocks, stocks } = this.state;
    const updatedCurrentStocks = currentStocks.filter(
      (item) => item !== currentStocks[id]
    );
    let updatedStocks = stocks.filter((item) => item !== stocks[id]);

    if (updatedStocks.length < 1) {
      updatedStocks = [];
    }

    this.setState(
      { currentStocks: [...updatedCurrentStocks], stocks: [...updatedStocks] },
      function() {
        this.compileStockData();
        this.showTickers();
      }
    );
  };

  showTickers = debounce(() => {
    let count = 0;
    this.state.currentStocks.forEach((ticker, i) => {
      if (this.state.stocks[i].length > 0) count++;
    });
    this.setState({ tickers: count });
  }, 250);

  yAxisFormatter = (yAxis) => {
    return `$${yAxis}`;
  };

  render() {
    const {
      lastSearched,
      currentStocks,
      inputValue,
      stocks,
      initialLoad,
      stocksData,
      tickers,
    } = this.state;
    return (
      <Grid fluid>
        <div className="App">
          <SweetAlert
            show={this.state.showError}
            type="error"
            title="Uh oh.."
            text={`We couldn't find anything for ${lastSearched}.`}
            confirmButtonText="TRY AGAIN"
            onConfirm={() => this.setState({ showError: false })}
          />

          <Row>
            <Col md={12}>
              <div>
                <h1 className="heading">$ STOCKS</h1>
              </div>

              <div className="stock-wrapper">
                {currentStocks.map((stock, index) => {
                  return (
                    <div
                      className="stock"
                      onClick={() => this.deleteStock(index)}
                      key={`current-stock-${index}`}
                    >
                      {stock}
                      <div className="close">
                        <svg
                          viewPort="0 0 12 12"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line
                            x1="1"
                            y1="11"
                            x2="11"
                            y2="1"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <line
                            x1="1"
                            y1="1"
                            x2="11"
                            y2="11"
                            stroke="white"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>

              <FormGroup controlId="formBasicText" className="form-wrapper">
                <FormControl
                  type="text"
                  value={inputValue}
                  placeholder="Try AMZN or VSLR"
                  onChange={this.handleChange}
                  onKeyPress={this.handleKeyPress}
                />

                <Button className="form-button" onClick={this.addStock}>
                  SUBMIT
                </Button>
              </FormGroup>

              <p
                className={`notice
                  ${isEmpty(stocks[0]) && initialLoad ? 'notice-large' : ''}`}
              >
                ☝️ Enter a stock symbol then hit return, enter, or click submit
                ☝️
              </p>
            </Col>
          </Row>

          <Row>
            {stocksData.length > 0 && (
              <Col md={12}>
                <h3 className="graph-title">Last 3 months</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stocksData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={this.yAxisFormatter} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    {[...Array(tickers)].map((stock, i) => (
                      <Line
                        type="monotone"
                        dataKey={currentStocks[i]}
                        stroke={palette[i]}
                        key={`tickers-${stock}-${i}`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Col>
            )}
            {stocksData.length === 0 && initialLoad && (
              <Col md={12}>
                <iframe
                  title="Money GIF"
                  src="https://giphy.com/embed/sa6KfGNKwd0c"
                  width="480"
                  height="257"
                  frameBorder="0"
                  class="giphy-embed"
                  allowFullScreen
                />
              </Col>
            )}
          </Row>
        </div>
      </Grid>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
