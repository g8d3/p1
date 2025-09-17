import streamlit as st
import yfinance as yf
import pandas as pd
import vectorbt as vbt
import openai
import traceback
from streamlit.components.v1 import html

st.set_page_config(page_title="Solana OHLCV Chat App", layout="wide")

# Initialize session state variables
if "messages" not in st.session_state:
    st.session_state.messages = []
if "params_hash" not in st.session_state:
    st.session_state.params_hash = None
if "api_key" not in st.session_state:
    st.session_state.api_key = ""
if "ohlcv_df" not in st.session_state:
    st.session_state.ohlcv_df = pd.DataFrame()

# Sidebar for user parameters
st.sidebar.title("Settings")

# Time range configuration
start_date = st.sidebar.date_input(
    "Start Date",
    value=pd.Timestamp.today().date() - pd.Timedelta(days=30)
)
range_type = st.sidebar.radio(
    "Range Type",
    ("Duration", "End Date"),
    index=0
)

# Calculate end date based on range type
if range_type == "Duration":
    duration_days = st.sidebar.number_input(
        "Duration (days)",
        min_value=1,
        value=30
    )
    end_date = start_date + pd.Timedelta(days=duration_days)
else:
    end_date = st.sidebar.date_input("End Date")

# Convert dates to Timestamp for yfinance
start_ts = pd.Timestamp(start_date)
end_ts = pd.Timestamp(end_date)

# LLM configuration
llm_choice = st.sidebar.selectbox(
    "LLM Model",
    ("GPT-3.5", "GPT-4"),
    index=0
)
api_key = st.sidebar.text_input(
    "OpenAI API Key",
    value=st.session_state.api_key,
    type="password",
    help="Get key from https://platform.openai.com/"
)
st.session_state.api_key = api_key  # Update stored API key

# Generate parameters hash to detect changes
params = {
    "start_date": start_date,
    "end_date": end_date,
    "range_type": range_type,
    "llm_choice": llm_choice,
    "duration_days": duration_days if range_type == "Duration" else None
}
current_params_hash = hash(frozenset(params.items()))

# Reset chat history and data when parameters change
if st.session_state.params_hash != current_params_hash:
    st.session_state.messages = []
    st.session_state.ohlcv_df = pd.DataFrame()
    st.session_state.params_hash = current_params_hash

# Fetch and process OHLCV data
ticker = "SOL-USD"
try:
    raw_data = yf.Ticker(ticker).history(interval="4h", start=start_ts, end=end_ts)
    if raw_data.empty:
        st.error(f"No data found for {ticker} between {start_date} and {end_date}")
    else:
        st.success("Data fetched successfully!")
        ohlcv_df = raw_data[["Open", "High", "Low", "Close", "Volume"]].copy()
        st.session_state.ohlcv_df = ohlcv_df

        # Display VectorBT OHLCV plot with error handling
        st.subheader("4h OHLCV Chart")
        try:
            fig = ohlcv_df.vbt.ohlcv.plot(
                title=f"{ticker} 4 Hour OHLCV ({start_date} to {end_date})",
                show_volume=True
            )
            st.pyplot(fig)
        except Exception as e:
            plot_err = traceback.format_exc()
            if "anywidget" in plot_err:
                error_msg = (
                    "Plotting error: Missing 'anywidget' package required for interactive plots.\n"
                    "Install it using:\n\n"
                    "pip install anywidget\n\n"
                    "Full traceback:\n" + plot_err
                )
            else:
                error_msg = f"Plotting error:\n{plot_err}"
            st.error(error_msg)
            # Add copy button with unique key to avoid conflicts
            if st.button("Copy Plot Error", key="copy_plot_error"):
                html(f"<script>navigator.clipboard.writeText(`{error_msg.replace('`','\\`')}`);alert('Copied!');</script>", height=0)

        # Show data statistics
        st.subheader("Data Summary")
        st.dataframe(ohlcv_df.describe().T, use_container_width=True)

except Exception as e:
    data_err = traceback.format_exc()
    st.error(f"Data fetch/processing error:\n{data_err}")
    if st.button("Copy Data Error", key="copy_data_error"):
        html(f"<script>navigator.clipboard.writeText(`{data_err.replace('`','\\`')}`);alert('Copied!');</script>", height=0)

# Main chat interface
st.title("Chat with LLM about Solana Data")

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Get new user input
prompt = st.chat_input("Ask a question about the OHLCV data...")

if prompt:
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Validate data availability
    ohlcv_df = st.session_state.ohlcv_df
    if ohlcv_df.empty:
        response = "No data available. Please check your time range settings."
        st.session_state.messages.append({"role": "assistant", "content": response})
        st.stop()

    # Validate API key
    if not api_key.strip():
        response = "Please enter your OpenAI API key in the sidebar."
        st.session_state.messages.append({"role": "assistant", "content": response})
        st.stop()

    # Prepare context from OHLCV data (truncated for token limits)
    max_context_rows = 50
    full_len = len(ohlcv_df)
    context_data = pd.concat([ohlcv_df.head(max_context_rows), ohlcv_df.tail(max_context_rows)]) if full_len > 2 * max_context_rows else ohlcv_df
    context = (
        f"Solana ({ticker}) 4h OHLCV data from {start_date} to {end_date}:\n"
        f"Columns: Open, High, Low, Close, Volume\n"
        f"Total rows: {full_len}\n\n"
        "Sample data (first and last 50 rows):\n"
        f"{context_data.to_string()}"
    )

    # Configure LLM model
    model = "gpt-3.5-turbo" if llm_choice == "GPT-3.5" else "gpt-4"

    # Generate LLM response with error handling
    try:
        openai.api_key = api_key
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an AI analyst specializing in cryptocurrency market data. Use the provided OHLCV context to answer the user's questions. If the question can't be answered with the given data, explain why."},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {prompt}"}
            ],
            temperature=0.7,
            max_tokens=500
        )["choices"][0]["message"]["content"]
    except Exception as e:
        llm_err = traceback.format_exc()
        response = f"LLM Error:\n{llm_err}"
        st.session_state.messages.append({"role": "assistant", "content": response})
        with st.chat_message("assistant"):
            st.markdown(response)
            if st.button("Copy LLM Error", key=f"copy_llm_error_{len(st.session_state.messages)-1}"):
                html(f"<script>navigator.clipboard.writeText(`{llm_err.replace('`','\\`')}`);alert('Copied!');</script>", height=0)
        st.stop()

    # Add response to chat history
    st.session_state.messages.append({"role": "assistant", "content": response})
