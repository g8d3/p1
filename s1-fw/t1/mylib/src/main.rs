use mylib;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    mylib::mylib("./a.db").await?;
    Ok(())
}